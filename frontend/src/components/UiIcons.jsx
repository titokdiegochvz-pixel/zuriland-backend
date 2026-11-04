import React from 'react';

export const CartIcon = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 4h2l2.2 11.1a2 2 0 0 0 2 1.6h8.5a2 2 0 0 0 1.9-1.4L21 8H6" />
        <circle cx="10" cy="20" r="1" />
        <circle cx="18" cy="20" r="1" />
    </svg>
);

export const UserIcon = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
);

export const CardIcon = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 10h18m-14 5h4" />
    </svg>
);

export const TrashIcon = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 7h16m-10 4v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3" />
    </svg>
);
