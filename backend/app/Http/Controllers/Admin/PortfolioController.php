<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Portfolio;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;

class PortfolioController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Portfolio::latest();

        if ($request->has('trashed')) {
            $query->onlyTrashed();
        }

        $portfolios = $query->paginate(10);
        
        return view('admin.portfolio.index', compact('portfolios'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return view('admin.portfolio.create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'img' => 'required|string',
            'overview' => 'required|string',
            'goals' => 'required|string',
            'features' => 'required|array',
            'features.*.title' => 'required|string|max:255',
            'features.*.desc' => 'required|string',
            'architecture' => 'required|string',
            'tech_stack' => 'required|array',
            'tech_stack.*' => 'required|string|max:255',
            'link' => 'nullable|url',
            'role' => 'required|string',
        ]);

        // Sanitasi input string untuk mencegah XSS
        $validated['title'] = strip_tags($validated['title']);
        $validated['category'] = strip_tags($validated['category']);
        $validated['overview'] = strip_tags($validated['overview']);
        $validated['goals'] = strip_tags($validated['goals']);
        $validated['architecture'] = strip_tags($validated['architecture']);
        $validated['role'] = strip_tags($validated['role']);

        // Sanitasi untuk array features
        $validated['features'] = array_map(function ($feature) {
            return [
                'title' => strip_tags($feature['title']),
                'desc' => strip_tags($feature['desc']),
            ];
        }, $validated['features']);

        // Sanitasi untuk array tech_stack
        $validated['tech_stack'] = array_map('strip_tags', $validated['tech_stack']);

        $validated['slug'] = Str::slug($validated['title']);

        Portfolio::create($validated);

        return redirect()->route('admin.portfolio.index')->with('success', 'Portfolio created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Portfolio $portfolio)
    {
        return view('admin.portfolio.show', compact('portfolio'));
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Portfolio $portfolio)
    {
        return view('admin.portfolio.edit', compact('portfolio'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Portfolio $portfolio): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'img' => 'required|string',
            'overview' => 'required|string',
            'goals' => 'required|string',
            'features' => 'required|array',
            'features.*.title' => 'required|string|max:255',
            'features.*.desc' => 'required|string',
            'architecture' => 'required|string',
            'tech_stack' => 'required|array',
            'tech_stack.*' => 'required|string|max:255',
            'link' => 'nullable|url',
            'role' => 'required|string',
        ]);

        // Sanitasi input string untuk mencegah XSS
        $validated['title'] = strip_tags($validated['title']);
        $validated['category'] = strip_tags($validated['category']);
        $validated['overview'] = strip_tags($validated['overview']);
        $validated['goals'] = strip_tags($validated['goals']);
        $validated['architecture'] = strip_tags($validated['architecture']);
        $validated['role'] = strip_tags($validated['role']);

        // Sanitasi untuk array features
        $validated['features'] = array_map(function ($feature) {
            return [
                'title' => strip_tags($feature['title']),
                'desc' => strip_tags($feature['desc']),
            ];
        }, $validated['features']);

        // Sanitasi untuk array tech_stack
        $validated['tech_stack'] = array_map('strip_tags', $validated['tech_stack']);

        if ($portfolio->title !== $validated['title']) {
            $validated['slug'] = Str::slug($validated['title']);
        }

        $portfolio->update($validated);

        return redirect()->route('admin.portfolio.index')->with('success', 'Portfolio updated successfully.');
    }

    /**
     * Restore the specified resource from storage.
     */
    public function restore(string $id): RedirectResponse
    {
        $portfolio = Portfolio::withTrashed()->findOrFail($id);
        $portfolio->restore();

        return redirect()->route('admin.portfolio.index')->with('success', 'Portfolio restored successfully.');
    }

    /**
     * Permanently remove the specified resource from storage.
     */
    public function forceDelete(string $id): RedirectResponse
    {
        $portfolio = Portfolio::withTrashed()->findOrFail($id);
        $portfolio->forceDelete();

        return redirect()->route('admin.portfolio.index')->with('success', 'Portfolio permanently deleted.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Portfolio $portfolio): RedirectResponse
    {
        $portfolio->delete();

        return redirect()->route('admin.portfolio.index')->with('success', 'Portfolio moved to trash.');
    }
}
