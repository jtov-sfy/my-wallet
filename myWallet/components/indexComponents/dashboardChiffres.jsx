import { Text, View, TouchableOpacity, Image, StyleSheet } from "react-native";
import { couleurs } from '@/constants/Couleurs';
import arrowUp from "@/assets/images/arrowUp.png";
import arrowDown from "@/assets/images/arrowDown.png";

const convertColorToRGBA = (hex, opacity) => {
    let r = parseInt(hex.substring(1, 3), 16);
    let g = parseInt(hex.substring(3, 5), 16);
    let b = parseInt(hex.substring(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };  

// DASHBOARD AVEC LES CHIFFRES IMPORTANT DE L'APPLICATION
export function DashboardChiffres({setVisibiliteModalEntreeArgent, setVisibiliteModalSortieArgent, budgetMensuel, bugdetTotal}){
    // Fonction qui ajoute des espaces entre les milliers 
    function refactoringBudget(chiffre) {
        let budgetRefactore;
        if(chiffre >= 1000){
            let reste = (chiffre%1000).toFixed(2);
            let milliers = Math.floor(chiffre/1000);
            budgetRefactore = milliers + " " + reste + "€";
        } else {
            chiffre = chiffre.toFixed(2);
            budgetRefactore = chiffre + "€";
        }
        return budgetRefactore;
    }

    // Récupère le jour et retourne le pourcentage d'avancement dans le mois
    function timeToPourcentage() {
        const date = new Date();
        const jour = date.getUTCDate();
        const mois = date.getMonth();
        const annee = date.getFullYear();
    
        const estBissextile = (annee % 4 === 0 && annee % 100 !== 0) || (annee % 400 === 0);
        const joursFevrier = estBissextile ? 29 : 28;
    
        const mois31 = [0, 2, 4, 6, 7, 9, 11]; // Mois ayant 31 jours
        const mois30 = [3, 5, 8, 10]; // Mois ayant 30 jours
    
        let pourcentage;
    
        if (mois31.includes(mois)) {
            pourcentage = ((jour / 31) * 100).toFixed(0);
        } else if (mois30.includes(mois)) {
            pourcentage = ((jour / 30) * 100).toFixed(0);
        } else {
            pourcentage = ((jour / joursFevrier) * 100).toFixed(0);
        }
    
        pourcentage = Number(pourcentage);
        if (pourcentage === 0) {
            pourcentage++;
        }
        pourcentage += "%";
        
        return pourcentage;
    }
    

    return(
        <View style={styles.containerGeneral}>
            <View style={styles.containerChiffres}>
                {/*Chiffres (budget mensuel et budget général*/}
                <View>
                    <Text style={styles.textChiffres}>{refactoringBudget(budgetMensuel)}</Text>
                    <Text style={[styles.textChiffres, styles.textChiffresDessous]}>{refactoringBudget(bugdetTotal)}</Text>
                </View>
                <Text style={styles.textPourcentage}>{timeToPourcentage()}</Text>
            </View>
            {/*Boutons vers les formulaires*/}
            <View style={styles.containerBoutons}>
                <TouchableOpacity style={[styles.bouton, {backgroundColor: couleurs.lightGreen}]} onPress={() => setVisibiliteModalEntreeArgent(true)}>
                    <Image source={arrowUp} style={styles.image}/>
                    <Text style={[styles.textBouton, {color: couleurs.darkGreen}]}>Entrée argent</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.bouton, {backgroundColor: couleurs.darkGreen}]} onPress={() => setVisibiliteModalSortieArgent(true)}>
                    <Image source={arrowDown} style={styles.image}/>
                    <Text style={[styles.textBouton, {color: couleurs.lightGreen}]}>Sortie argent</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    // Containers
    containerGeneral : {
        backgroundColor: couleurs.white,
        margin: 20,
        padding: 10,
        borderRadius: 10,
        // Ombre pour iOS
        boxShadow: `0px 5px 10px ${convertColorToRGBA(couleurs.black, 0.25)}`,
        // Ombre pour Android
        elevation: 10, 
    },
    containerChiffres : {
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    bouton : {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 5,
        width: 140,
        height: 30,
        marginRight: 5,
    }, 
    containerBoutons : {
        display: "flex",
        flexDirection: "row",
        marginTop: 50
    },
    // textes
    textChiffres : {
        fontFamily: 'HelveticaBold',
        fontSize: 50,
        marginTop: -10,
        color: couleurs.black
    },
    textChiffresDessous : {
        color: couleurs.grey,
        marginTop: -15,
    },
    textPourcentage: {
        fontFamily: 'HelveticaRegular',
        fontSize: 14,
    },
    textBouton : {
        fontFamily: 'HelveticaRegular',
        fontSize: 14,
        marginLeft: -3,
        marginTop: 3
    },
    // autres
    image : {
        width: 25,
        height: 25
    }
});