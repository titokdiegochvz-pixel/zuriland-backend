import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../store/CartContext';
import { STORE_PRODUCTS } from '../store/catalog';
import { CartIcon } from './UiIcons';
import './Store.css';

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
                <h1>Tienda ZURILAND</h1>
                <p>Mejora tu experiencia en el servidor con rangos, kits y beneficios exclusivos.</p>
            </div>

            <div className="category-nav" role="group" aria-label="Categorías de la tienda">
                <button
                    type="button"
                    className={category === 'rangos' ? 'active' : ''}
                    aria-pressed={category === 'rangos'}
                    onClick={() => setCategory('rangos')}
                >
                    Rangos
                </button>
                <button
                    type="button"
                    className={category === 'cosmeticos' ? 'active' : ''}
                    aria-pressed={category === 'cosmeticos'}
                    onClick={() => setCategory('cosmeticos')}
                >
                    Cosméticos
                </button>
                <button
                    type="button"
                    className={category === 'comandos' ? 'active' : ''}
                    aria-pressed={category === 'comandos'}
                    onClick={() => setCategory('comandos')}
                >
                    Comandos
                </button>
            </div>

            <p className="store-cart-status" role="status" aria-live="polite">
                {addedMessage || (count > 0 ? `${count} productos en tu carrito.` : '')}
            </p>

            {products.length ? (
                <div className="shop-grid">
                    {products.map((product) => (
                        <article className="rank-card" key={product.title}>
                            <h2>{product.title}</h2>
                            <p>{product.description}</p>
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
        </section>
    );
};

export default Store;
