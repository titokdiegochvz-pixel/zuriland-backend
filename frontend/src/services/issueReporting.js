import { API_URL } from '../config/api';

const FEATURES = new Set(['account', 'payment', 'minecraft-status']);

export const reportClientIssue = (feature, status) => {
    if (!FEATURES.has(feature)) {
        console.error('Cannot report a client issue with an unknown feature.');
        return;
    }

    const httpStatus = Number.isInteger(status) && status >= 400 && status <= 599
        ? status
        : null;

    fetch(`${API_URL}/api/client-issues`, {
        method: 'POST',
        keepalive: true,
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            feature,
            failure: httpStatus === null ? 'network' : 'http_error',
            status: httpStatus,
        }),
    }).then((response) => {
        if (!response.ok) {
            console.warn(`Client issue report was rejected with HTTP ${response.status}.`);
        }
    }).catch(() => {
        console.warn('Client issue report could not reach the server.');
    });
};
