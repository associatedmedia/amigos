@extends('webadmin.layout.app')

@section('content')
<div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
    <h1 class="h2">Dashboard</h1>
</div>

<h4 class="mb-3 text-secondary"><i class="bi bi-cart"></i> Orders Overview</h4>
<div class="row text-center mb-4">
    <div class="col-md-4 mb-3">
        <div class="card text-white bg-info shadow-sm h-100 border-0">
            <div class="card-body">
                <h5 class="card-title"><i class="bi bi-cart"></i> Today's Orders</h5>
                <h2 class="card-text fw-bold">{{ $todayOrders }}</h2>
            </div>
        </div>
    </div>
    <div class="col-md-4 mb-3">
        <div class="card text-white bg-primary shadow-sm h-100 border-0">
            <div class="card-body">
                <h5 class="card-title"><i class="bi bi-cart-check"></i> Weekly Orders</h5>
                <h2 class="card-text fw-bold">{{ $weeklyOrders }}</h2>
            </div>
        </div>
    </div>
    <div class="col-md-4 mb-3">
        <div class="card text-white bg-dark shadow-sm h-100 border-0">
            <div class="card-body">
                <h5 class="card-title"><i class="bi bi-receipt"></i> Total Orders</h5>
                <h2 class="card-text fw-bold">{{ $totalOrders }}</h2>
            </div>
        </div>
    </div>
</div>

<h4 class="mb-3 text-secondary"><i class="bi bi-currency-rupee"></i> Sales & Revenue</h4>
<div class="row text-center mb-4">
    <div class="col-md-4 mb-3">
        <div class="card text-white bg-success shadow-sm h-100 border-0">
            <div class="card-body">
                <h5 class="card-title"><i class="bi bi-currency-rupee"></i> Today's Sales</h5>
                <h2 class="card-text fw-bold">₹{{ number_format($todaySales, 2) }}</h2>
            </div>
        </div>
    </div>
    <div class="col-md-4 mb-3">
        <div class="card text-dark bg-warning shadow-sm h-100 border-0">
            <div class="card-body">
                <h5 class="card-title"><i class="bi bi-graph-up"></i> Weekly Sales</h5>
                <h2 class="card-text fw-bold">₹{{ number_format($weeklySales, 2) }}</h2>
            </div>
        </div>
    </div>
    <div class="col-md-4 mb-3">
        <div class="card text-white bg-secondary shadow-sm h-100 border-0">
            <div class="card-body">
                <h5 class="card-title"><i class="bi bi-wallet2"></i> Total Sales</h5>
                <h2 class="card-text fw-bold">₹{{ number_format($totalSales, 2) }}</h2>
            </div>
        </div>
    </div>
</div>

<h4 class="mb-3 text-secondary"><i class="bi bi-database"></i> System Statistics</h4>
<div class="row text-center mb-4">
    <div class="col-md-4 mb-3">
        <div class="card text-white bg-primary shadow-sm h-100 border-0" style="opacity: 0.9;">
            <div class="card-body">
                <h5 class="card-title"><i class="bi bi-box-seam"></i> Products</h5>
                <h2 class="card-text fw-bold">{{ $totalProducts }}</h2>
            </div>
        </div>
    </div>
    <div class="col-md-4 mb-3">
        <div class="card text-white bg-danger shadow-sm h-100 border-0">
            <div class="card-body">
                <h5 class="card-title"><i class="bi bi-tags"></i> Categories</h5>
                <h2 class="card-text fw-bold">{{ $totalCategories }}</h2>
            </div>
        </div>
    </div>
    <div class="col-md-4 mb-3">
        <div class="card text-white bg-dark shadow-sm h-100 border-0" style="opacity: 0.9;">
            <div class="card-body">
                <h5 class="card-title"><i class="bi bi-people"></i> Users</h5>
                <h2 class="card-text fw-bold">{{ $totalUsers }}</h2>
            </div>
        </div>
    </div>
</div>

<h4>Recent Orders</h4>

<ul class="nav nav-tabs mb-0" id="dashOrderTabs" role="tablist">
    <li class="nav-item" role="presentation">
        <button class="nav-link active" id="delivered-tab" data-bs-toggle="tab" data-bs-target="#tab-delivered" type="button" role="tab">
            <i class="bi bi-check-circle"></i> Successful <span class="badge bg-success ms-1">{{ $orderCounts['delivered'] }}</span>
        </button>
    </li>
    <li class="nav-item" role="presentation">
        <button class="nav-link" id="cancelled-tab" data-bs-toggle="tab" data-bs-target="#tab-cancelled" type="button" role="tab">
            <i class="bi bi-x-circle"></i> Failed <span class="badge bg-danger ms-1">{{ $orderCounts['cancelled'] }}</span>
        </button>
    </li>
    <li class="nav-item" role="presentation">
        <button class="nav-link" id="pending-tab" data-bs-toggle="tab" data-bs-target="#tab-pending" type="button" role="tab">
            <i class="bi bi-clock"></i> Pending <span class="badge bg-warning text-dark ms-1">{{ $orderCounts['pending'] }}</span>
        </button>
    </li>
    <li class="nav-item" role="presentation">
        <button class="nav-link" id="all-tab" data-bs-toggle="tab" data-bs-target="#tab-all" type="button" role="tab">
            <i class="bi bi-list-ul"></i> All <span class="badge bg-dark ms-1">{{ $orderCounts['all'] }}</span>
        </button>
    </li>
</ul>

<div class="tab-content">
    {{-- Delivered Tab --}}
    <div class="tab-pane fade show active" id="tab-delivered" role="tabpanel">
        @include('webadmin.partials.dashboard_orders_table', ['orders' => $deliveredOrders])
    </div>
    {{-- Cancelled Tab --}}
    <div class="tab-pane fade" id="tab-cancelled" role="tabpanel">
        @include('webadmin.partials.dashboard_orders_table', ['orders' => $cancelledOrders])
    </div>
    {{-- Pending Tab --}}
    <div class="tab-pane fade" id="tab-pending" role="tabpanel">
        @include('webadmin.partials.dashboard_orders_table', ['orders' => $pendingOrders])
    </div>
    {{-- All Orders Tab --}}
    <div class="tab-pane fade" id="tab-all" role="tabpanel">
        @include('webadmin.partials.dashboard_orders_table', ['orders' => $recentOrders])
    </div>
</div>

@endsection
