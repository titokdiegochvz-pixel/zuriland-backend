export const STORE_PRODUCTS = [
    { title: 'Elite', price: 49, description: 'Kit hierro', category: 'rangos' },
    { title: 'Dios', price: 79, description: 'Kit diamante', category: 'rangos' },
    { title: 'Leyenda', price: 149, description: 'Kit Netherite', category: 'rangos' },
    {
        title: 'Pack Utilidad',
        price: 49,
        description: '/feed (10m), /heal (15m), /fix (uso único), /enderchest',
        category: 'comandos',
    },
    {
        title: 'Pack Maestro',
        price: 149,
        description: '/heal ilimitado, /feed ilimitado, /fix ilimitado, /nick, 10 slots /sethome',
        category: 'comandos',
    },
];

export const findStoreProduct = (title) =>
    STORE_PRODUCTS.find((product) => product.title === title);
