<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Admin\PortfolioController as AdminPortfolioController;
use App\Http\Controllers\Admin\UserController as AdminUserController;

Route::get('/', function () {
    return view('welcome');
});

// Authentication Routes
Route::get('/login', function () {
    return 'Login Page Placeholder'; // Placeholder until view is created
})->name('login');
Route::post('/login', [LoginController::class, 'authenticate']);
Route::post('/logout', [LoginController::class, 'logout'])->name('logout');

// Admin Protected Routes
Route::middleware(['auth', 'security.headers'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', function () {
        return 'Admin Dashboard Placeholder';
    })->name('dashboard');

    // Portfolio Management with Soft Deletes
    Route::post('portfolio/{id}/restore', [AdminPortfolioController::class, 'restore'])->name('portfolio.restore');
    Route::delete('portfolio/{id}/force-delete', [AdminPortfolioController::class, 'forceDelete'])->name('portfolio.force-delete');
    Route::resource('portfolio', AdminPortfolioController::class);

    // User Management with Soft Deletes
    Route::post('user/{id}/restore', [AdminUserController::class, 'restore'])->name('user.restore');
    Route::delete('user/{id}/force-delete', [AdminUserController::class, 'forceDelete'])->name('user.force-delete');
    Route::resource('user', AdminUserController::class);
});
