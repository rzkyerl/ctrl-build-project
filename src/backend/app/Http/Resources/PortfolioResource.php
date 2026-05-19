<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PortfolioResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->slug,
            'title' => $this->title,
            'category' => $this->category,
            'img' => $this->img,
            'overview' => $this->overview,
            'goals' => $this->goals,
            'features' => $this->features,
            'architecture' => $this->architecture,
            'techStack' => $this->tech_stack,
            'link' => $this->link,
            'role' => $this->role,
        ];
    }
}
