import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../store/CartContext';
import { STORE_PRODUCTS } from '../store/catalog';
import {
    CartIcon,
    CardIcon,
    CommandIcon,
    CrownIcon,
    DiamondIcon,
    IronIcon,
    ShirtIcon,
} from './UiIcons';
import './Store.css';

const categoryDetails = {
    rangos: { label: 'Rangos', Icon: CrownIcon },
    cosmeticos: { label: 'Cosméticos', Icon: ShirtIcon },
    comandos: { label: 'Comandos', Icon: CommandIcon },
};

const getProductIcon = (product) => {
    if (product.title === 'Elite') return IronIcon;
    if (product.title === 'Dios') return DiamondIcon;
    if (product.title === 'Leyenda') return CrownIcon;
    return CommandIcon;
};

const Store = () => {
    const [category, setCategory] = useState('rangos');
    const [addedMessage, setAddedMessage] = useState('');
    const { addItem, count } = useCart();

    const products = STORE_PRODUCTS.filter((product) => product.category === category);

    const addToCart = (product) => {
        addItem(product.title);
        setAddedMessage(`${product.title} se agregó al carrito.`);
    };

    return (
        <section className="store-page">
            <div className="store-heading">
                <span className="store-heading-icon" aria-hidden="true">
                    <CartIcon />
                </span>
                <h1>TIENDA <span>ZURILAND</span></h1>
                <p>Mejora tu experiencia en el servidor con rangos, kits y beneficios exclusivos.</p>
            </div>

            <div className="category-nav" role="group" aria-label="Categorías de la tienda">
                {Object.entries(categoryDetails).map(([id, { label, Icon }]) => (
                    <button
                        key={id}
                        type="button"
                        className={category === id ? 'active' : ''}
                        aria-pressed={category === id}
                        onClick={() => setCategory(id)}
                    >
                        <Icon />
                        {label}
                    </button>
                ))}
            </div>

            <p className="store-cart-status" role="status" aria-live="polite">
                {addedMessage || (count > 0 ? `${count} productos en tu carrito.` : '')}
            </p>

            {category === 'comandos' && (
                <p className="store-category-prices">
                    Pack Utilidad: <strong>$49 MXN</strong>
                    <span aria-hidden="true"> · </span>
                    Pack Maestro: <strong>$149 MXN</strong>
                </p>
            )}

            {products.length ? (
                <div className="shop-grid">
                    {products.map((product) => (
                        <article
                            className={`rank-card product-card product-card--${product.title.toLowerCase().replace(/\s+/g, '-')}`}
                            key={product.title}
                        >
                            <span className="product-emblem" aria-hidden="true">
                                {React.createElement(getProductIcon(product))}
                            </span>
                            <h2>{product.title}</h2>
                            <p className="product-description">Incluye:</p>
                            <ul className="product-benefits">
                                {product.benefits.map((benefit) => (
                                    <li key={benefit}>{benefit}</li>
                                ))}
                            </ul>
                            <strong className="store-price">
                                ${product.price} <span>MXN</span>
                            </strong>
                            <button
                                type="button"
                                className="btn-buy store-add-button"
                                onClick={() => addToCart(product)}
                            >
                                <CartIcon />
                                Agregar al carrito
                            </button>
                        </article>
                    ))}
                </div>
            ) : (
                <p className="store-empty">No hay productos disponibles en esta categoría.</p>
            )}

            {count > 0 && (
                <Link className="store-cart-link" to="/cart">
                    Ver carrito ({count})
                </Link>
            )}

            <p className="store-payment-note">
                <CardIcon />
                Opciones de pago con tarjeta y PayPal
            </p>
        </section>
    );
};

export default Store;
