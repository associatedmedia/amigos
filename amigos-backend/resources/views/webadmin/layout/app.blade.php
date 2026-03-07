<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Amigos Admin Panel</title>
    <!-- Bootstrap 5 -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css">
    <style>
        .sidebar {
            min-height: calc(100vh - 56px);
        }
    </style>
</head>
<body>

    @auth
        <!-- Navbar -->
        <nav class="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
            <div class="container-fluid">
                <a class="navbar-brand fw-bold" href="{{ route('admin.dashboard') }}">Amigos Admin</a>
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                    <span class="navbar-toggler-icon"></span>
                </button>
                <div class="collapse navbar-collapse" id="navbarNav">
                    <ul class="navbar-nav ms-auto">
                        <li class="nav-item">
                            <form action="{{ route('admin.logout') }}" method="POST" class="d-inline">
                                @csrf
                                <button type="submit" class="btn btn-danger btn-sm">Logout <i class="bi bi-box-arrow-right"></i></button>
                            </form>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>

        <div class="container-fluid">
            <div class="row">
                <!-- Sidebar -->
                <nav class="col-md-3 col-lg-2 d-md-block bg-white border-end sidebar collapse px-0">
                    <div class="position-sticky pt-3">
                        <ul class="nav flex-column">
                            <li class="nav-item">
                                <a class="nav-link py-3 border-bottom {{ request()->routeIs('admin.dashboard') ? 'active bg-light fw-bold text-dark' : 'text-secondary' }}" href="{{ route('admin.dashboard') }}">
                                    <i class="bi bi-speedometer2 me-2"></i> Dashboard
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link py-3 border-bottom {{ request()->routeIs('admin.orders.*') ? 'active bg-light fw-bold text-dark' : 'text-secondary' }}" href="{{ route('admin.orders.index') }}">
                                    <i class="bi bi-receipt me-2"></i> Orders
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link py-3 border-bottom {{ request()->routeIs('admin.products.*') ? 'active bg-light fw-bold text-dark' : 'text-secondary' }}" href="{{ route('admin.products.index') }}">
                                    <i class="bi bi-box-seam me-2"></i> Products
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link py-3 border-bottom {{ request()->routeIs('admin.categories.*') ? 'active bg-light fw-bold text-dark' : 'text-secondary' }}" href="{{ route('admin.categories.index') }}">
                                    <i class="bi bi-tags me-2"></i> Categories
                                </a>
                            </li>
                        </ul>
                    </div>
                </nav>

                <!-- Page Content -->
                <main class="col-md-9 ms-sm-auto col-lg-10 px-md-4 py-4 bg-light shadow-inner">
                    @yield('content')
                </main>
            </div>
        </div>
    @else
        <!-- Guest Content (Login) -->
        <div class="bg-light" style="min-height: 100vh;">
            @yield('content')
        </div>
    @endauth

    <!-- Bootstrap JS Bundle -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
