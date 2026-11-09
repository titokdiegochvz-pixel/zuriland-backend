<p align="center"><a href="https://laravel.com" target="_blank"><img src="https://raw.githubusercontent.com/laravel/art/master/logo-lockup/5%20SVG/2%20CMYK/1%20Full%20Color/laravel-logolockup-cmyk-red.svg" width="400" alt="Laravel Logo"></a></p>

<p align="center">
<a href="https://github.com/laravel/framework/actions"><img src="https://github.com/laravel/framework/workflows/tests/badge.svg" alt="Build Status"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/dt/laravel/framework" alt="Total Downloads"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/v/laravel/framework" alt="Latest Stable Version"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/l/laravel/framework" alt="License"></a>
</p>

## About Laravel

Laravel is a web application framework with expressive, elegant syntax. We believe development must be an enjoyable and creative experience to be truly fulfilling. Laravel takes the pain out of development by easing common tasks used in many web projects, such as:

- [Simple, fast routing engine](https://laravel.com/docs/routing).
- [Powerful dependency injection container](https://laravel.com/docs/container).
- Multiple back-ends for [session](https://laravel.com/docs/session) and [cache](https://laravel.com/docs/cache) storage.
- Expressive, intuitive [database ORM](https://laravel.com/docs/eloquent).
- Database agnostic [schema migrations](https://laravel.com/docs/migrations).
- [Robust background job processing](https://laravel.com/docs/queues).
- [Real-time event broadcasting](https://laravel.com/docs/broadcasting).

Laravel is accessible, powerful, and provides tools required for large, robust applications.

## Learning Laravel

Laravel has the most extensive and thorough [documentation](https://laravel.com/docs) and video tutorial library of all modern web application frameworks, making it a breeze to get started with the framework. You can also check out [Laravel Learn](https://laravel.com/learn), where you will be guided through building a modern Laravel application.

If you don't feel like reading, [Laracasts](https://laracasts.com) can help. Laracasts contains thousands of video tutorials on a range of topics including Laravel, modern PHP, unit testing, and JavaScript. Boost your skills by digging into our comprehensive video library.

## Laravel Sponsors

We would like to extend our thanks to the following sponsors for funding Laravel development. If you are interested in becoming a sponsor, please visit the [Laravel Partners program](https://partners.laravel.com).

### Premium Partners

- **[Vehikl](https://vehikl.com)**
- **[Tighten Co.](https://tighten.co)**
- **[Kirschbaum Development Group](https://kirschbaumdevelopment.com)**
- **[64 Robots](https://64robots.com)**
- **[Curotec](https://www.curotec.com/services/technologies/laravel)**
- **[DevSquad](https://devsquad.com/hire-laravel-developers)**
- **[Redberry](https://redberry.international/laravel-development)**
- **[Active Logic](https://activelogic.com)**

## Contributing

Thank you for considering contributing to the Laravel framework! The contribution guide can be found in the [Laravel documentation](https://laravel.com/docs/contributions).

## Code of Conduct

In order to ensure that the Laravel community is welcoming to all, please review and abide by the [Code of Conduct](https://laravel.com/docs/contributions#code-of-conduct).

## Security Vulnerabilities

If you discover a security vulnerability within Laravel, please send an e-mail to Taylor Otwell via [taylor@laravel.com](mailto:taylor@laravel.com). All security vulnerabilities will be promptly addressed.

## PayPal checkout

Add your PayPal Developer sandbox credentials to `.env` and run the database
migrations before testing the PayPal option in the frontend:

```env
PAYPAL_CLIENT_ID=your-sandbox-client-id
PAYPAL_SECRET=your-sandbox-secret
PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com
FRONTEND_URL=http://localhost:3000
```

For production, use live credentials and set `PAYPAL_BASE_URL` to
`https://api-m.paypal.com`. Never expose the PayPal secret in the frontend.

## Deployment

### Serve frontend and API from one public URL for local testing

The React source is in `frontend/`. To build the site locally, run:

```powershell
cd frontend
npm ci
npm run build:laravel
```

This writes the site and its assets to the Laravel project's `public/site`
directory. The Dockerfile builds the frontend automatically for deployments,
so generated files remain ignored by Git. The Laravel web routes serve the
React entry point for client-side routes, while `/api/*` remains handled by the
API routes.

Start Laravel with `php artisan serve --host=127.0.0.1 --port=8000`, then expose
that port with a tunnel such as Cloudflare Tunnel. The tunnel URL serves both
the React website and API, so no separate frontend URL is required. Set
`APP_URL` and `FRONTEND_URL` in the backend `.env` to that public URL and run
`php artisan config:clear`. Keep Laravel and the tunnel running; a temporary
tunnel URL may change when restarted.

The React frontend and Laravel API can be served from the same public URL; in
that setup the frontend calls `/api/*` on the same origin. If they are hosted
separately, set `VITE_API_URL` in `frontend/.env` to the public Laravel API
origin before building. Configure the backend environment with:

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.example.com
FRONTEND_URL=https://example.com
CORS_ALLOWED_ORIGINS=https://example.com
```

Use a persistent production database, run `php artisan migrate --force`, and
set payment-provider credentials on the backend only. Keep `.env` files and
secrets out of the public repository. Configure the frontend host to serve
`index.html` for client-side routes such as `/store` and `/pago-exitoso`.

### Deploy remotely for free with Render

Deploy `render.yaml` as a Blueprint in Render. The Dockerfile builds the React
frontend and serves it with the Laravel API. The service uses PostgreSQL;
create a database on Neon and set its connection string as `DB_URL`.
Render's free web service can sleep while idle, and Neon free databases scale
to zero.

Set the API's `APP_KEY` to the output of `php artisan key:generate --show`.
After deployment, set `APP_URL` to the API's public URL. Set
`FRONTEND_URL` and `CORS_ALLOWED_ORIGINS` if the frontend uses a separate
origin. Enter payment-provider credentials directly in Render's environment
settings; never put them in Git or the frontend.

To enable password recovery, configure a verified SMTP sender in the Render
service environment: `MAIL_MAILER=smtp`, `MAIL_HOST`, `MAIL_PORT=587`,
`MAIL_SCHEME=smtp`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM_ADDRESS`, and
`MAIL_FROM_NAME=ZuriLand`. Save the settings, wait for the service to restart,
then send a recovery email to an account you control. Do not commit or share
SMTP credentials. The password recovery endpoint stays unavailable while the
production mailer is `log`; its warning is written to Render logs.

Operational client reports contain only an allow-listed feature, failure type,
and optional HTTP status (no usernames, email addresses, or raw error text).
They are rate limited and written to the Render service logs.
To email alerts after SMTP is active, set `OPS_ALERT_EMAIL` in Render. Alerts
are deduplicated to at most one per feature and failure type every 15 minutes.

For end-to-end payment checks without real charges, use a separate staging
service with Stripe test credentials (`STRIPE_SECRET` beginning with `sk_test_`)
and PayPal sandbox credentials with
`PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com`. Test a successful checkout,
cancel before approval, and verify that an unconfirmed order never clears the
cart. Never put sandbox credentials on the live service. The automated tests
mock both payment providers and do not move money.

The web container starts Apache without running database migrations, and
serves React pages directly so a database or Laravel configuration problem
does not take the public site offline. The `/api/*` and `/up` routes continue
through Laravel. After configuring `DB_URL`, run `php artisan migrate --force`
once from the Render service shell to prepare the database. Database-backed
API features require this step and a reachable PostgreSQL database.

Towny city pages list all residents and show connection status; publish the
updated `minecraft-plugin/target/zuriland-towny-sync-1.0.1.jar` to the Minecraft
server as well so its roster sync includes offline residents.

## License

The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
