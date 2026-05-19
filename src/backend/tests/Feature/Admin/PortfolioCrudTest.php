<?php

namespace Tests\Feature\Admin;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\User;
use App\Models\Portfolio;

class PortfolioCrudTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create();
    }

    /**
     * Test admin can create portfolio.
     */
    public function test_admin_can_create_portfolio(): void
    {
        $response = $this->actingAs($this->admin)->post('/admin/portfolio', [
            'title' => 'New Project',
            'category' => 'Web Development',
            'img' => 'test.png',
            'overview' => 'Overview test',
            'goals' => 'Goals test',
            'features' => [
                ['title' => 'Feature 1', 'desc' => 'Desc 1']
            ],
            'architecture' => 'Architecture test',
            'tech_stack' => ['Laravel', 'React'],
            'role' => 'Fullstack',
        ]);

        $response->assertRedirect('/admin/portfolio');
        $this->assertDatabaseHas('portfolios', ['title' => 'New Project']);
    }

    /**
     * Test admin can soft delete portfolio.
     */
    public function test_admin_can_soft_delete_portfolio(): void
    {
        $portfolio = Portfolio::create([
            'slug' => 'delete-me',
            'title' => 'Delete Me',
            'category' => 'Web',
            'img' => 'test.png',
            'overview' => 'Test',
            'goals' => 'Test',
            'features' => [],
            'architecture' => 'Test',
            'tech_stack' => [],
            'role' => 'Dev',
        ]);

        $response = $this->actingAs($this->admin)->delete("/admin/portfolio/{$portfolio->id}");

        $response->assertRedirect('/admin/portfolio');
        $this->assertSoftDeleted('portfolios', ['id' => $portfolio->id]);
    }

    /**
     * Test admin can restore soft deleted portfolio.
     */
    public function test_admin_can_restore_portfolio(): void
    {
        $portfolio = Portfolio::create([
            'slug' => 'restore-me',
            'title' => 'Restore Me',
            'category' => 'Web',
            'img' => 'test.png',
            'overview' => 'Test',
            'goals' => 'Test',
            'features' => [],
            'architecture' => 'Test',
            'tech_stack' => [],
            'role' => 'Dev',
        ]);
        $portfolio->delete();

        $response = $this->actingAs($this->admin)->post("/admin/portfolio/{$portfolio->id}/restore");

        $response->assertRedirect('/admin/portfolio');
        $this->assertDatabaseHas('portfolios', ['id' => $portfolio->id, 'deleted_at' => null]);
    }
}
