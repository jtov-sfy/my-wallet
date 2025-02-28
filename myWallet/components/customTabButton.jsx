import { StyleSheet, TouchableOpacity, View, Image } from "react-native";
import homeLogoSelected from "@/assets/images/homeLogo-selected.png";
import reglagesLogoSelected from "@/assets/images/reglagesLogo-selected.png";
import calendrierLogoSelected from "@/assets/images/calendrierLogo-selected.png";
import homeLogoUnselected from "@/assets/images/homeLogo-unselected.png";
import reglagesLogoUnselected from "@/assets/images/reglagesLogo-unselected.png";
import calendrierLogoUnselected from "@/assets/images/calendrierLogo-unselected.png";
import { couleurs } from '@/constants/Couleurs.ts';

// COMPOSANT POUR LE MENU GÉNÉRAL
export function CustomTabButton({ state, descriptors, navigation }) {
    return (
        <View style={styles.tabBar}>
            {state.routes.map((route, index) => {
                const { options } = descriptors[route.key];
                const label = options.title || route.name; 
                const estSelectionne = state.index === index; 

                const onPress = () => {
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    });

                    if (!estSelectionne && !event.defaultPrevented) {
                        navigation.navigate(route.name);
                    }
                };

                return (
                    <TouchableOpacity
                        key={index}
                        onPress={onPress}
                        style={[styles.tabButton, estSelectionne && styles.selectedTab]}
                    >
                        {label === "index" && (
                            <Image style={styles.iconButtonNav} source={estSelectionne ? homeLogoSelected : homeLogoUnselected} />
                        )}
                        {label === "previewScreen" && (
                            <Image style={styles.iconButtonNav} source={estSelectionne ? calendrierLogoSelected : calendrierLogoUnselected} />
                        )}
                        {label === "reglagesScreen" && (
                            <Image style={styles.iconButtonNav} source={estSelectionne ? reglagesLogoSelected : reglagesLogoUnselected} />
                        )}
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        flexDirection: 'row',
        width: 250,
        height: 80,
        backgroundColor: couleurs.darkGreen,
        justifyContent: "space-around",
        alignItems: "center",
        borderRadius: 80,
        marginBottom: 40,
        marginLeft: "auto",
        marginRight: "auto",
        // Ombre pour iOS
        boxShadow: '0px 5px 10px rgba(0, 0, 0, 0.25)',
        // Ombre pour Android
        elevation: 10, 
    },
    tabButton: {
        height: 70,
        width: 70,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: couleurs.darkGreen,
        borderRadius: 100
    },
    selectedTab: {
        backgroundColor: couleurs.lightGreen,
    },
    iconButtonNav: {
        width: 50, 
        height: 50,
    }    
});
