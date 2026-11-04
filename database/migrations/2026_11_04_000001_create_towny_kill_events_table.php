<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('towny_kill_events', function (Blueprint $table) {
            $table->id();
            $table->uuid('event_id')->unique();
            $table->string('killer_name', 16);
            $table->string('killer_town', 100)->nullable();
            $table->string('victim_name', 16);
            $table->timestamp('occurred_at');
            $table->timestamps();

            $table->index(['occurred_at', 'id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('towny_kill_events');
    }
};
