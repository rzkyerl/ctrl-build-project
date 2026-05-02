<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Portfolio;
use App\Http\Resources\PortfolioResource;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PortfolioController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): AnonymousResourceCollection
    {
        $portfolios = Portfolio::all();
        return PortfolioResource::collection($portfolios);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $slug): PortfolioResource
    {
        $portfolio = Portfolio::where('slug', $slug)->firstOrFail();
        return new PortfolioResource($portfolio);
    }
}
