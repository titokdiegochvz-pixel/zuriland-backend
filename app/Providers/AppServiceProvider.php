<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        RateLimiter::for('towny-ranking-sync', function (Request $request) {
            $syncToken = (string) config('services.towny.sync_token');

            return Limit::perMinute(120)
                ->by('towny-ranking-sync:'.hash('sha256', $syncToken));
        });

        RateLimiter::for('towny-town-sync', function (Request $request) {
            $syncToken = (string) config('services.towny.sync_token');

            return Limit::perMinute(120)
                ->by('towny-town-sync:'.hash('sha256', $syncToken));
        });
    }
}
