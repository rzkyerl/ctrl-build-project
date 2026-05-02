<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Portfolio extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'slug',
        'title',
        'category',
        'img',
        'overview',
        'goals',
        'features',
        'architecture',
        'tech_stack',
        'link',
        'role',
    ];

    protected $casts = [
        'features' => 'array',
        'tech_stack' => 'array',
    ];
}
