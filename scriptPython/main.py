import xlsxwriter
from firebase_admin import credentials, db
import firebase_admin
from datetime import datetime
from collections import defaultdict

# Initialiser Firebase
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred, {
    'databaseURL': "https://my-budget-app-125c7-default-rtdb.europe-west1.firebasedatabase.app/",

})

# Couleurs pour générer les graphiques
colors = ['#002A00', '#1C5518', '#388030', '#55AA49', '#71D561', "#0F3B0E", "#2E6E24", "#4F8E3A", "#6BB053", "#89D16A", "#A2E284", "#BFF69B"] 

# Constantes
ref = db.reference('transactions')
users = ref.get() or {}
transactions_2025 = defaultdict(list)
mois_traduction = {
    "january": "janvier",
    "february": "fevrier",
    "march": "mars",
    "april": "avril",
    "may": "mai",
    "june": "juin",
    "july": "juillet",
    "august": "aout",
    "september": "septembre",
    "october": "octobre",
    "november": "novembre",
    "december": "decembre",
}
annee_actuelle = datetime.now().year

# Récupérer les données depuis firebase
for key, transaction in users.items():
    try:
        prix = float(transaction["prix"]) 
        date_str = transaction["date"]
        if date_str.endswith("Z"):
            date_str = date_str[:-1]
        date_obj = datetime.fromisoformat(date_str)
        mois_nom_en = date_obj.strftime("%B").lower()
        mois_nom_fr = mois_traduction.get(mois_nom_en, None)

        if mois_nom_fr and date_obj.year == annee_actuelle:
            transactions_2025[mois_nom_fr].append([
                transaction['label'],
                transaction['categorie'],
                prix,
                transaction['date'],
                key
            ])
    except KeyError as e:
        print(f"Champ manquant dans la transaction {key} : {e}")
    except ValueError as e:
        print(f"Erreur de conversion dans la transaction {key} : {e}")


# Création du fichier excel
workbook = xlsxwriter.Workbook('transactions_2025.xlsx')

# Formatage des cases excel (couleur background et police d'écriture)
header_format = workbook.add_format({
    'bold': True,
    'align': 'center',
    'valign': 'vcenter',
    'bg_color': '#71D561',
    'font_name': 'Helvetica',
    'color': '#002A00',
})
normal_format = workbook.add_format({
    'align': 'left',
    'valign': 'top',
    'bg_color': '#F1F1F3',
    'font_name': 'Helvetica',
    'color': '#1A1A1A',
})
currency_format = workbook.add_format({
    'num_format': '#,##0.00',
    'align': 'center',
})

# Ajouter une feuille par mois
for mois, transactions in transactions_2025.items():
    worksheet_name = mois.capitalize()[:31] 
    worksheet = workbook.add_worksheet(name=worksheet_name)

    # Ajouter les en-têtes
    headers = ["Label", "Categorie", "Prix", "Date", "Identifiant"]
    worksheet.write_row(0, 0, headers, header_format)

    # Ajouter les transactions
    for row_idx, transaction in enumerate(transactions, start=1):
        worksheet.write_row(row_idx, 0, transaction, normal_format)
    worksheet.set_column(0, len(headers) - 1, 25)

    # Regrouper les transactions par catégorie
    categorie_totaux = defaultdict(float)
    for transaction in transactions:
        categorie = transaction[1]  
        montant = transaction[2]  
        categorie_totaux[categorie] += montant

    # Ajouter les données pour le graphique
    categories = list(categorie_totaux.keys())
    valeurs = [float(v) for v in categorie_totaux.values() if isinstance(v, (int, float))]

    if not categories or not valeurs:
        continue 
    
    # Ajout d'un tableau avec les catégories de dépenses et d'un tableau avec le bilan du mois (entrées d'argent, sortie d'argent)
    start_row = 18 
    worksheet.write(17, 6, "Categories", header_format) 
    worksheet.write(17, 7, "Valeurs", header_format)     
    worksheet.set_column(17, 6, 12)
    worksheet.set_column(17, 7, 8)
    worksheet.write_column(start_row, 6, categories, normal_format)  
    worksheet.write_column(start_row, 7, valeurs, normal_format) 
    worksheet.write(17, 9, "Total sorties argent", header_format) 
    worksheet.write(17, 10, "Total entrées d'argent", header_format)
    worksheet.write(17, 11, "Balance", header_format)
    total_depenses = sum(t[2] for t in transactions if t[2] < 0)
    total_entrees = sum(t[2] for t in transactions if t[2] >= 0)
    balance = total_entrees + total_depenses
    worksheet.write(18, 9, total_depenses, normal_format)  
    worksheet.write(18, 10, total_entrees, normal_format)
    worksheet.write(18, 11, balance, normal_format)
    worksheet.set_column(17, 9, 20)
    worksheet.set_column(17, 10, 20)
    worksheet.set_column(17, 11, 20)

    # Diagramme circulaire
    doughnut_chart = workbook.add_chart({'type': 'doughnut'})
    doughnut_chart.add_series({
        'name': f"Catégories - {mois.capitalize()}",
        'categories': [worksheet_name, start_row, 6, start_row + len(categories) - 1, 6],
        'values': [worksheet_name, start_row, 7, start_row + len(categories) - 1, 7],
        'data_labels': {
            'percentage': True,
            'font': {'name': 'Helvetica', 'size': 10, 'color': '#1A1A1A'},
        },
        'points': [{'fill': {'color': color}} for color in colors[:len(categories)]],  # Couleurs des seg
    })
    doughnut_chart.set_title({
        'name': f"Catégories - {mois.capitalize()}",
        'name_font': {'bold': True, 'size': 25, 'color': '#1A1A1A', 'name': 'Helvetica'},  # Police du titre
    })
    doughnut_chart.set_chartarea({
        'border': {'color': '#1A1A1A', 'width': 3}, 
        'fill': {'color': '#F1F1F3'},   
    })
    doughnut_chart.set_plotarea({
        'border': {'color': '#F1F1F3'}, 
        'fill': {'color': '#F1F1F3'}, 
        'layout': {
            'x': 0,
            'y': 0.16,
            'width': 1,
            'height': 0.8,
        }
    })
    worksheet.insert_chart('G2', doughnut_chart)


# Feuille bilan
bilan_sheet = workbook.add_worksheet("BILAN")

# Données par mois
months = [mois.capitalize() for mois in transactions_2025.keys()]
bilan_sheet.write_row(0, 1, months, header_format)
bilan_sheet.write(1, 0, "Sorties d'argent", header_format)
bilan_sheet.write(2, 0, "Entrées d'argent", header_format)
bilan_sheet.write(3, 0, "Balance", header_format)
bilan_sheet.set_column(0, 0, 20)
bilan_sheet.set_column(1, len(months) + 1, 10)

sorties = []
entrees = []
balances = []

for mois, transactions in transactions_2025.items():
    total_depenses = sum(t[2] for t in transactions if t[2] < 0)
    total_entrees = sum(t[2] for t in transactions if t[2] >= 0)
    sorties.append(total_depenses)
    entrees.append(total_entrees)
    balances.append(total_entrees + total_depenses)

bilan_sheet.write_row(1, 1, sorties, normal_format)
bilan_sheet.write_row(2, 1, entrees, normal_format)
bilan_sheet.write_row(3, 1, balances, normal_format)

# Graphique des sorties d'argent
sorties_chart = workbook.add_chart({'type': 'column'})
sorties_chart.add_series({
    'name': "Sorties d'argent",
    'categories': ['BILAN', 0, 1, 0, len(months)], 
    'values': ['BILAN', 1, 1, 1, len(months)],     
    'data_labels': {
        'value': True,             
        'font': {'bold': True, 'color': '#71D561', 'name' : 'Helvetica'},    
    },
    'fill': {'color': '#71D561'},   
    'border': {'color': '#71D561'}  
})
sorties_chart.set_title({
    'name': "Sorties d'argent",
    'name_font': {'bold': True, 'size': 25, 'color': '#71D561', 'name': 'Helvetica'},  
})
sorties_chart.set_x_axis({
    'name': 'Mois',
    'name_font': {'bold': True, 'size': 12, 'color': "#71D561", 'name' : 'Helvetica'},
    'num_font': {'color': "#71D561", 'name' : 'Helvetica'}, 
    'major_gridlines': {
        'visible': True,
        'line': {'color': '#D3D3D3', 'width': 1, 'dash_type': 'dash'},  
    },
    'line': {'color': '#F1F1F3', 'width': 1.5},  
    'label_position': 'high', 
})
sorties_chart.set_y_axis({
    'name': 'Montant (€)',
    'name_font': {'bold': True, 'size': 12, 'color': "#71D561", 'name' : 'Helvetica'},
    'num_font': {'color': "#71D561", 'name' : 'Helvetica'}, 
    'major_gridlines': {
        'visible': False,
    },
    'line': {'color': '#F1F1F3', 'width': 1.5},  
})
sorties_chart.set_chartarea({
    'border': {'color': '#71D561', 'width': 3}, 
    'fill': {'color': '#002A00'},  
})
sorties_chart.set_plotarea({
    'border': {'color': '#002A00'}, 
    'fill': {'color': '#002A00'},  
    'layout': {
        'x': 0.17,    
        'y': 0.27,  
        'width': 0.8,
        'height': 0.6,  
    }
})
sorties_chart.set_legend({'none': True})
bilan_sheet.insert_chart('B36', sorties_chart)

# Graphique des entrées d'argent
entrees_chart = workbook.add_chart({'type': 'column'})
entrees_chart.add_series({
    'name': "Entrées d'argent",
    'categories': ['BILAN', 0, 1, 0, len(months)],  
    'values': ['BILAN', 2, 1, 2, len(months)],      
    'data_labels': {
        'value': True,           
        'font': {'bold': True, 'color': '#002A00', 'name': 'Helvetica'},  
    },
    'fill': {'color': '#002A00'}, 
    'border': {'color': '#002A00'} 
})
entrees_chart.set_title({
    'name': "Entrées d'argent",
    'name_font': {'bold': True, 'size': 25, 'color': '#002A00', 'name': 'Helvetica'}, 
})
entrees_chart.set_x_axis({
    'name': 'Mois',
    'name_font': {'bold': True, 'size': 12, 'color': "#002A00", 'name': 'Helvetica'},
    'num_font': {'color': "#002A00", 'name': 'Helvetica'}, 
    'major_gridlines': {
        'visible': True,
        'line': {'color': '#D3D3D3', 'width': 1, 'dash_type': 'dash'},  
    },
    'line': {'color': '#F1F1F3', 'width': 1.5},
    'label_position': 'high',
})
entrees_chart.set_y_axis({
    'name': 'Montant (€)',
    'name_font': {'bold': True, 'size': 12, 'color': "#002A00", 'name': 'Helvetica'},
    'num_font': {'color': "#002A00", 'name': 'Helvetica'}, 
    'major_gridlines': {
        'visible': False,
    },
    'line': {'color': '#F1F1F3', 'width': 1.5},
})
entrees_chart.set_chartarea({
    'border': {'color': '#002A00', 'width': 3}, 
    'fill': {'color': '#71D561'}, 
})

entrees_chart.set_plotarea({
    'border': {'color': '#71D561'}, 
    'fill': {'color': '#71D561'},
    'layout': {
        'x': 0.17,  
        'y': 0.27,   
        'width': 0.8,
        'height': 0.6,
    }
})
entrees_chart.set_legend({'none': True}) 
bilan_sheet.insert_chart('B21', entrees_chart)

# Graphique de la balance (BarChart)
balance_chart = workbook.add_chart({'type': 'column'}) 
balance_chart.add_series({
    'name': "Balance Mensuelle",
    'categories': ['BILAN', 0, 1, 0, len(months)], 
    'values': ['BILAN', 3, 1, 3, len(months)],     
    'data_labels': {
        'value': True,            
        'font': {'bold': True, 'color': '#71D561', 'name': 'Helvetica'},  
    },
    'fill': {'color': '#71D561'},   
    'border': {'color': '#71D561'}  
})
balance_chart.set_title({
    'name': "Balance Mensuelle",
    'name_font': {'bold': True, 'size': 25, 'color': '#1A1A1A', 'name': 'Helvetica'}, 
})
balance_chart.set_x_axis({
    'name': 'Mois',
    'name_font': {'bold': True, 'size': 12, 'color': "#1A1A1A", 'name': 'Helvetica'},
    'num_font': {'color': "#1A1A1A", 'name': 'Helvetica'}, 
    'major_gridlines': {
        'visible': False, 
    },
    'line': {'color': '#1A1A1A', 'width': 1.5},
})
balance_chart.set_y_axis({
    'name': 'Montant (€)',
    'name_font': {'bold': True, 'size': 12, 'color': "#1A1A1A", 'name': 'Helvetica'},
    'num_font': {'color': "#1A1A1A", 'name': 'Helvetica'}, 
    'major_gridlines': {
        'visible': True,
        'line': {'color': '#D3D3D3', 'width': 1, 'dash_type': 'dash'}, 
    },
    'line': {'color': '#1A1A1A', 'width': 1.5},  
})
balance_chart.set_chartarea({
    'border': {'color': '#1A1A1A', 'width': 3}, 
    'fill': {'color': '#F1F1F3'},  
})
balance_chart.set_plotarea({
    'border': {'color': '#F1F1F3'}, 
    'fill': {'color': '#F1F1F3'},   
    'layout': {
        'x': 0.15, 
        'y': 0.25, 
        'width': 0.8, 
        'height': 0.6,  
    }
})
balance_chart.set_legend({'none': True})
bilan_sheet.insert_chart('B6', balance_chart)

workbook.close()
