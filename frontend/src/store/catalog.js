export const STORE_PRODUCTS = [
    { title: 'Elite', price: 49, description: 'Kit hierro', benefits: ['Kit de hierro'], category: 'rangos' },
    { title: 'Dios', price: 79, description: 'Kit diamante', benefits: ['Kit de diamante'], category: 'rangos' },
    { title: 'Leyenda', price: 149, description: 'Kit Netherite', benefits: ['Kit de Netherite'], category: 'rangos' },
    {
        title: 'Pack Utilidad',
        price: 49,
        description: '/feed (10m), /heal (15m), /fix (uso único), /enderchest',
        benefits: ['/feed (10 min)', '/heal (15 min)', '/fix (un uso)', '/enderchest'],
        category: 'comandos',
    },
    {
        title: 'Pack Maestro',
        price: 149,
        description: '/heal ilimitado, /feed ilimitado, /fix ilimitado, /nick, 10 slots /sethome',
        benefits: ['/heal ilimitado', '/feed ilimitado', '/fix ilimitado', '/nick', '10 espacios de /sethome'],
        category: 'comandos',
    },
];

export const findStoreProduct = (title) =>
    STORE_PRODUCTS.find((product) => product.title === title);
