<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use App\Models\Portfolio;

class PortfolioSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $portfolios = [
            [
                'slug' => '3nt-studio',
                'title' => '3NT Studio - Website Photostudio',
                'category' => 'Web Development',
                'img' => '3nt-home-mockup-opt.webp',
                'overview' => 'Proyek ini adalah 3NT Studio, sebuah platform website premium yang berfungsi sebagai Portfolio Fotografi & Sistem Booking Otomatis. Website ini dirancang dengan estetika modern, minimalis, dan monokromatik untuk memberikan kesan mewah dan profesional bagi sebuah studio foto.',
                'goals' => 'Proyek ini bertujuan untuk menjadi etalase digital bagi 3NT Studio dalam memamerkan karya fotografi mereka sekaligus menyediakan sistem manajemen pemesanan (booking) yang terintegrasi bagi calon klien.',
                'features' => [
                    ['title' => 'Portfolio Dinamis', 'desc' => 'Galeri foto yang dapat dikelola secara langsung melalui Sanity CMS dengan efek visual menarik.'],
                    ['title' => 'Sistem Booking Otomatis', 'desc' => 'Pengguna dapat memilih paket dan tanggal pemesanan dengan konfirmasi PDF real-time.'],
                    ['title' => 'Interactive Photobooth', 'desc' => 'Fitur unik untuk mengambil foto monokrom langsung dari browser.'],
                    ['title' => 'Cinematic Hero Section', 'desc' => 'Latar belakang video layar penuh dan animasi tipografi yang halus.'],
                    ['title' => 'Admin Dashboard', 'desc' => 'Dashboard berbasis Sanity Studio untuk mengelola konten dan reservasi.'],
                ],
                'architecture' => 'Proyek ini menggunakan arsitektur modern yang memisahkan Frontend (React 19 + Vite + Tailwind CSS 4) dan Backend/CMS (Sanity.io).',
                'tech_stack' => ['React 19', 'Vite', 'Tailwind CSS 4', 'Sanity CMS', 'Framer Motion', 'jsPDF', 'TypeScript'],
                'link' => 'https://3nt-studio.vercel.app',
                'role' => 'Full-stack Developer / UI Designer',
            ],
            [
                'slug' => 'bookingin',
                'title' => 'Bookingin - Website Hotel',
                'category' => 'Web Development',
                'img' => 'bookingin-home-mockup-opt.webp',
                'overview' => 'Bookingin adalah platform pemesanan hotel modern yang memudahkan pengguna mencari dan memesan akomodasi.',
                'goals' => 'Menyediakan pengalaman pemesanan hotel yang mulus dan cepat.',
                'features' => [
                    ['title' => 'Pencarian Hotel', 'desc' => 'Cari hotel berdasarkan lokasi dan tanggal.'],
                    ['title' => 'Detail Kamar', 'desc' => 'Informasi lengkap mengenai fasilitas dan harga.'],
                ],
                'architecture' => 'Built with React and Laravel API.',
                'tech_stack' => ['React', 'Laravel', 'MySQL'],
                'link' => null,
                'role' => 'Full-stack Developer',
            ],
            [
                'slug' => 'ektm',
                'title' => 'EKTM - Mobile Apps EKTM',
                'category' => 'Mobile Apps',
                'img' => 'HomePages.png',
                'overview' => 'Aplikasi mobile untuk manajemen kartu tanda mahasiswa elektronik.',
                'goals' => 'Digitalisasi kartu mahasiswa untuk kemudahan akses.',
                'features' => [
                    ['title' => 'Digital ID', 'desc' => 'Menampilkan kartu mahasiswa dalam format digital.'],
                ],
                'architecture' => 'Mobile application developed with React Native.',
                'tech_stack' => ['React Native', 'Firebase'],
                'link' => null,
                'role' => 'Mobile Developer',
            ],
            [
                'slug' => 'berbagi-lagi',
                'title' => 'Berbagi Lagi - Website Donasi',
                'category' => 'Web Development',
                'img' => 'berbagi-home-mockup-opt.webp',
                'overview' => 'Platform donasi online untuk membantu sesama.',
                'goals' => 'Memfasilitasi penggalangan dana secara transparan.',
                'features' => [
                    ['title' => 'Sistem Donasi', 'desc' => 'Proses donasi yang mudah dan aman.'],
                ],
                'architecture' => 'Web application with integrated payment gateway.',
                'tech_stack' => ['React', 'Node.js', 'MongoDB'],
                'link' => null,
                'role' => 'Full-stack Developer',
            ],
            [
                'slug' => 'the-days',
                'title' => 'The Days - Website Coffee',
                'category' => 'Web Development',
                'img' => 'thedays-home-mockup-opt.webp',
                'overview' => 'Website katalog dan pemesanan untuk kedai kopi modern.',
                'goals' => 'Meningkatkan visibilitas brand kedai kopi.',
                'features' => [
                    ['title' => 'Katalog Menu', 'desc' => 'Daftar menu kopi dan makanan yang menarik.'],
                ],
                'architecture' => 'Single Page Application (SPA).',
                'tech_stack' => ['React', 'Tailwind CSS'],
                'link' => null,
                'role' => 'Frontend Developer',
            ],
            [
                'slug' => 'anagata-executive',
                'title' => 'Anagata Executive - Website JobPortal',
                'category' => 'Web Development',
                'img' => 'anagata-home-mockup.png',
                'overview' => 'Portal lowongan kerja khusus untuk posisi eksekutif.',
                'goals' => 'Menghubungkan profesional dengan perusahaan terkemuka.',
                'features' => [
                    ['title' => 'Job Listing', 'desc' => 'Daftar pekerjaan terbaru dengan filter canggih.'],
                ],
                'architecture' => 'Enterprise-grade job portal architecture.',
                'tech_stack' => ['Next.js', 'Prisma', 'PostgreSQL'],
                'link' => null,
                'role' => 'Full-stack Developer',
            ],
        ];

        foreach ($portfolios as $data) {
            Portfolio::create($data);
        }
    }
}
