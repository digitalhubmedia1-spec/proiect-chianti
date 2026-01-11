export const isRestaurantOpen = () => {
    return true; // DEVELOPMENT MODE: Always Open
    /*
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const hour = now.getHours();

    // Check if it's Monday (1) to Friday (5)
    if (day >= 1 && day <= 5) {
        // Extended interval: 08:00 - 15:00
        if (hour >= 8 && hour < 15) {
            return true;
        }
    }
    return false;
    */
};

export const isPreOrderPeriod = () => {
    return false; // DEVELOPMENT MODE: No pre-order popup
    /*
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();

    if (day >= 1 && day <= 5) {
        // 08:00 - 11:00 is pre-order period
        if (hour >= 8 && hour < 11) {
            return true;
        }
    }
    return false;
    */
};

export const getScheduleMessage = () => {
    const preOrder = isPreOrderPeriod();
    if (preOrder) {
        return "Puteți plasa comanda acum, însă vă informăm că livrarea, ridicarea sau servirea în restaurant se vor efectua doar în intervalul orar 11:00 - 15:00.";
    }
    return "Comenzile sunt disponibile doar de Luni până Vineri, în intervalul orar 08:00 - 15:00. Livrările încep de la ora 11:00.";
};
