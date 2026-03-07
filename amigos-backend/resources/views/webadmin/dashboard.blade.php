@extends('webadmin.layout.app')

@section('content')
<div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
    <h1 class="h2">Dashboard</h1>
</div>

<div class="row text-center mb-4">
    <div class="col-md-3 mb-3">
        <div class="card text-white bg-primary shadow-sm h-100 border-0">
            <div class="card-body">
                <h5 class="card-title"><i class="bi bi-receipt"></i> Total Orders</h5>
                <h2 class="card-text fw-bold">{{ $totalOrders }}</h2>
            </div>
        </div>
    </div>
    <div class="col-md-3 mb-3">
        <div class="card text-white bg-success shadow-sm h-100 border-0">
            <div class="card-body">
                <h5 class="card-title"><i class="bi bi-currency-rupee"></i> Total Sales</h5>
                <h2 class="card-text fw-bold">₹{{ number_format($totalSales, 2) }}</h2>
            </div>
        </div>
    </div>
    <div class="col-md-3 mb-3">
        <div class="card text-white bg-warning shadow-sm h-100 border-0">
            <div class="card-body">
                <h5 class="card-title"><i class="bi bi-box-seam"></i> Products</h5>
                <h2 class="card-text fw-bold text-dark">{{ $totalProducts }}</h2>
            </div>
        </div>
    </div>
    <div class="col-md-3 mb-3">
        <div class="card text-white bg-info shadow-sm h-100 border-0">
            <div class="card-body">
                <h5 class="card-title"><i class="bi bi-people"></i> Users</h5>
                <h2 class="card-text fw-bold">{{ $totalUsers }}</h2>
            </div>
        </div>
    </div>
</div>

<h4>Recent Orders</h4>
<div class="table-responsive bg-white p-3 rounded shadow-sm border">
    <table class="table table-hover align-middle">
        <thead class="table-light">
            <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
            </tr>
        </thead>
        <tbody>
            @forelse($recentOrders as $order)
                <tr>
                    <td><strong>#{{ $order->order_number ?? $order->id }}</strong></td>
                    <td>
                        {{ $order->user ? $order->user->name : 'Guest' }}<br>
                        <small class="text-muted">{{ $order->user ? $order->user->mobile_no : 'N/A' }}</small>
                    </td>
                    <td>₹{{ number_format($order->total_amount, 2) }}</td>
                    <td>
                        <span class="badge bg-{{ $order->status === 'completed' ? 'success' : ($order->status === 'pending' ? 'warning' : 'secondary') }}">
                            {{ ucfirst($order->status) }}
                        </span>
                    </td>
                    <td>{{ $order->created_at->format('M d, Y h:i A') }}</td>
                    <td>
                        <a href="{{ route('admin.orders.show', $order->id) }}" class="btn btn-sm btn-outline-primary">View</a>
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="6" class="text-center text-muted">No recent orders found.</td>
                </tr>
            @endforelse
        </tbody>
    </table>
</div>

@endsection
