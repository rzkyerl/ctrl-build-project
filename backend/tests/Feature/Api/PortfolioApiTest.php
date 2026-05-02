<?php

namespace Tests\Feature\Api;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\Portfolio;

class PortfolioApiTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test can list all portfolios.
     */
    public function test_can_list_all_portfolios(): void
    {
        Portfolio::create([
            'slug' => 'test-project',
            'title' => 'Test Project',
            'category' => 'Web',
            'img' => 'test.png',
            'overview' => 'Test',
            'goals' => 'Test',
            'features' => [],
            'architecture' => 'Test',
            'tech_stack' => [],
            'role' => 'Dev',
        ]);

        $response = $this->getJson('/api/portfolios');

        $response->assertStatus(200)
                 ->assertJsonCount(1, 'data')
                 ->assertJsonPath('data.0.title', 'Test Project');
    }

    /**
     * Test can show single portfolio by slug.
     */
    public function test_can_show_single_portfolio(): void
    {
        Portfolio::create([
            'slug' => 'test-project',
            'title' => 'Test Project',
            'category' => 'Web',
            'img' => 'test.png',
            'overview' => 'Test',
            'goals' => 'Test',
            'features' => [],
            'architecture' => 'Test',
            'tech_stack' => [],
            'role' => 'Dev',
        ]);

        $response = $this->getJson('/api/portfolios/test-project');

        $response->assertStatus(200)
                 ->assertJsonPath('data.title', 'Test Project');
    }
}
