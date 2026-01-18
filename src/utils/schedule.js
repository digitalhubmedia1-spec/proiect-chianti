export const isRestaurantOpen = () => {
    return true; // Always open for orders
};

export const isPreOrderPeriod = () => {
    return false; // Deprecated concept, replaced by warning logic
};

export const getScheduleStatus = () => {
    const now = new Date();
    const hour = now.getHours();

    // Check for "Next Day" warning period: 15:00 - 06:00
    // If it's between 3 PM and 6 AM, show warning
    if (hour >= 15 || hour < 6) {
        return {
            isOpen: true,
            showWarning: true,
            title: "Atenție - Comenzi pentru mâine",
            message: "Puteți plasa comanda acum, însă vă informăm că livrarea, ridicarea sau servirea se vor efectua începând cu ziua următoare (program de luni până vineri, 11:00 - 15:00)."
        };
    }

    // Normal hours (06:00 - 15:00) - No warning
    return {
        isOpen: true,
        showWarning: false,
        title: "",
        message: ""
    };
};

export const getScheduleMessage = () => {
    const status = getScheduleStatus();
    if (status.showWarning) return status.message;
    return "Program livrări: Luni - Vineri, 11:00 - 15:00.";
};
