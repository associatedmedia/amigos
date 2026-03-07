<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Amigos Admin Panel</title>
    <!-- Bootstrap 5 -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css">
    <!-- DataTables CSS -->
    <link href="https://cdn.datatables.net/1.13.6/css/dataTables.bootstrap5.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css">
    <style>
        .sidebar {
            min-height: calc(100vh - 56px);
        }
        .sidebar .nav-link {
            transition: all 0.2s;
        }
        .sidebar .nav-link:hover {
            background-color: #f8f9fa;
        }
        .sidebar .collapse .nav-link {
            padding-left: 3rem;
            font-size: 0.9rem;
        }
    </style>
</head>
<body>

    @if(session('is_admin') || (auth()->check() && auth()->user()->role === 'admin'))
        <!-- Navbar -->
        <nav class="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
            <div class="container-fluid">
                <a class="navbar-brand fw-bold" href="{{ route('admin.dashboard') }}">Amigos Admin</a>
                <button class="navbar-toggler d-md-none collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#sidebarMenuWrapper" aria-controls="sidebarMenuWrapper" aria-expanded="false" aria-label="Toggle navigation">
                    <span class="navbar-toggler-icon"></span>
                </button>
                <div class="collapse navbar-collapse d-none d-lg-block" id="navbarNav">
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
                <nav id="sidebarMenuWrapper" class="col-md-3 col-lg-2 d-md-block bg-white border-end sidebar collapse px-0">
                    <div class="position-sticky pt-3 d-flex flex-column" style="height: calc(100vh - 56px);">
                        <ul class="nav flex-column mb-auto" id="sidebarMenu">
                            
                            <!-- Dashboard -->
                            <li class="nav-item">
                                <a class="nav-link py-3 border-bottom {{ request()->routeIs('admin.dashboard') ? 'active bg-light fw-bold text-dark' : 'text-secondary' }}" href="{{ route('admin.dashboard') }}">
                                    <i class="bi bi-speedometer2 me-2"></i> Dashboard
                                </a>
                            </li>

                            <!-- Customers Menu -->
                            <li class="nav-item">
                                <a class="nav-link py-3 border-bottom d-flex justify-content-between align-items-center {{ request()->routeIs('admin.customers.*') ? 'active bg-light fw-bold text-dark' : 'text-secondary' }}" 
                                   data-bs-toggle="collapse" href="#customersCollapse" role="button" aria-expanded="{{ request()->routeIs('admin.customers.*') ? 'true' : 'false' }}">
                                    <span><i class="bi bi-people me-2"></i> Customers</span>
                                    <i class="bi bi-chevron-down small"></i>
                                </a>
                                <div class="collapse {{ request()->routeIs('admin.customers.*') ? 'show' : '' }}" id="customersCollapse" data-bs-parent="#sidebarMenu">
                                    <ul class="nav flex-column mb-0 py-2 bg-light border-bottom">
                                        <li class="nav-item">
                                            <a class="nav-link {{ request()->routeIs('admin.customers.create') ? 'fw-bold text-primary' : 'text-secondary' }}" href="{{ route('admin.customers.create') }}">Add Customer</a>
                                        </li>
                                        <li class="nav-item">
                                            <a class="nav-link {{ request()->routeIs('admin.customers.index') ? 'fw-bold text-primary' : 'text-secondary' }}" href="{{ route('admin.customers.index') }}">List Customers</a>
                                        </li>
                                    </ul>
                                </div>
                            </li>

                            <!-- Orders Menu -->
                            <li class="nav-item">
                                <a class="nav-link py-3 border-bottom d-flex justify-content-between align-items-center {{ request()->routeIs('admin.orders.*') ? 'active bg-light fw-bold text-dark' : 'text-secondary' }}" 
                                   data-bs-toggle="collapse" href="#ordersCollapse" role="button" aria-expanded="{{ request()->routeIs('admin.orders.*') ? 'true' : 'false' }}">
                                    <span><i class="bi bi-receipt me-2"></i> Orders</span>
                                    <i class="bi bi-chevron-down small"></i>
                                </a>
                                <div class="collapse {{ request()->routeIs('admin.orders.*') ? 'show' : '' }}" id="ordersCollapse" data-bs-parent="#sidebarMenu">
                                    <ul class="nav flex-column mb-0 py-2 bg-light border-bottom">
                                        <li class="nav-item">
                                            <a class="nav-link {{ request()->routeIs('admin.orders.create') ? 'fw-bold text-primary' : 'text-secondary' }}" href="{{ route('admin.orders.create') }}">Add Order</a>
                                        </li>
                                        <li class="nav-item">
                                            <a class="nav-link {{ request()->routeIs('admin.orders.index') ? 'fw-bold text-primary' : 'text-secondary' }}" href="{{ route('admin.orders.index') }}">List Orders</a>
                                        </li>
                                    </ul>
                                </div>
                            </li>

                            <!-- Products Menu -->
                            <li class="nav-item">
                                <a class="nav-link py-3 border-bottom d-flex justify-content-between align-items-center {{ request()->routeIs('admin.products.*') ? 'active bg-light fw-bold text-dark' : 'text-secondary' }}" 
                                   data-bs-toggle="collapse" href="#productsCollapse" role="button" aria-expanded="{{ request()->routeIs('admin.products.*') ? 'true' : 'false' }}">
                                    <span><i class="bi bi-box-seam me-2"></i> Products</span>
                                    <i class="bi bi-chevron-down small"></i>
                                </a>
                                <div class="collapse {{ request()->routeIs('admin.products.*') ? 'show' : '' }}" id="productsCollapse" data-bs-parent="#sidebarMenu">
                                    <ul class="nav flex-column mb-0 py-2 bg-light border-bottom">
                                        <li class="nav-item">
                                            <a class="nav-link {{ request()->routeIs('admin.products.create') ? 'fw-bold text-primary' : 'text-secondary' }}" href="{{ route('admin.products.create') }}">Add Product</a>
                                        </li>
                                        <li class="nav-item">
                                            <a class="nav-link {{ request()->routeIs('admin.products.index') ? 'fw-bold text-primary' : 'text-secondary' }}" href="{{ route('admin.products.index') }}">List Products</a>
                                        </li>
                                    </ul>
                                </div>
                            </li>

                            <!-- Categories Menu -->
                            <li class="nav-item">
                                <a class="nav-link py-3 border-bottom d-flex justify-content-between align-items-center {{ request()->routeIs('admin.categories.*') ? 'active bg-light fw-bold text-dark' : 'text-secondary' }}" 
                                   data-bs-toggle="collapse" href="#categoriesCollapse" role="button" aria-expanded="{{ request()->routeIs('admin.categories.*') ? 'true' : 'false' }}">
                                    <span><i class="bi bi-tags me-2"></i> Categories</span>
                                    <i class="bi bi-chevron-down small"></i>
                                </a>
                                <div class="collapse {{ request()->routeIs('admin.categories.*') ? 'show' : '' }}" id="categoriesCollapse" data-bs-parent="#sidebarMenu">
                                    <ul class="nav flex-column mb-0 py-2 bg-light border-bottom">
                                        <li class="nav-item">
                                            <a class="nav-link {{ request()->routeIs('admin.categories.create') ? 'fw-bold text-primary' : 'text-secondary' }}" href="{{ route('admin.categories.create') }}">Add Category</a>
                                        </li>
                                        <li class="nav-item">
                                            <a class="nav-link {{ request()->routeIs('admin.categories.index') ? 'fw-bold text-primary' : 'text-secondary' }}" href="{{ route('admin.categories.index') }}">List Categories</a>
                                        </li>
                                    </ul>
                                </div>
                            </li>

                            <!-- Banners Menu -->
                            <li class="nav-item">
                                <a class="nav-link py-3 border-bottom d-flex justify-content-between align-items-center {{ request()->routeIs('admin.banners.*') ? 'active bg-light fw-bold text-dark' : 'text-secondary' }}" 
                                   data-bs-toggle="collapse" href="#bannersCollapse" role="button" aria-expanded="{{ request()->routeIs('admin.banners.*') ? 'true' : 'false' }}">
                                    <span><i class="bi bi-images me-2"></i> Banners</span>
                                    <i class="bi bi-chevron-down small"></i>
                                </a>
                                <div class="collapse {{ request()->routeIs('admin.banners.*') ? 'show' : '' }}" id="bannersCollapse" data-bs-parent="#sidebarMenu">
                                    <ul class="nav flex-column mb-0 py-2 bg-light border-bottom">
                                        <li class="nav-item">
                                            <a class="nav-link {{ request()->routeIs('admin.banners.create') ? 'fw-bold text-primary' : 'text-secondary' }}" href="{{ route('admin.banners.create') }}">Add Banner</a>
                                        </li>
                                        <li class="nav-item">
                                            <a class="nav-link {{ request()->routeIs('admin.banners.index') ? 'fw-bold text-primary' : 'text-secondary' }}" href="{{ route('admin.banners.index') }}">List Banners</a>
                                        </li>
                                    </ul>
                                </div>
                            </li>

                        </ul>

                        <!-- Sidebar Logout -->
                        <div class="mt-auto px-3 py-3 border-top">
                            <form action="{{ route('admin.logout') }}" method="POST">
                                @csrf
                                <button type="submit" class="btn btn-outline-danger w-100 text-start fw-bold">
                                    <i class="bi bi-box-arrow-right me-2"></i> Logout
                                </button>
                            </form>
                        </div>

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
    @endif

    <!-- JavaScript Dependencies -->
    <script src="https://code.jquery.com/jquery-3.7.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js"></script>
    <script src="https://cdn.datatables.net/1.13.6/js/dataTables.bootstrap5.min.js"></script>

    @stack('scripts')
</body>
</html>
