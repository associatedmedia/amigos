@extends('webadmin.layout.app')

@section('content')
<div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
    <h1 class="h2">Orders</h1>
</div>

<div class="table-responsive bg-white p-3 rounded shadow-sm border">
    <table class="table table-hover align-middle">
        <thead class="table-light">
            <tr>
                <th>Order #</th>
                <th>Customer Name</th>
                <th>Phone</th>
                <th>Total</th>
                <th>Payment Status</th>
                <th>Order Status</th>
                <th>Date</th>
                <th>Action</th>
            </tr>
        </thead>
        <tbody>
            @forelse($orders as $order)
                <tr>
                    <td><strong>#{{ $order->id }}</strong></td>
                    <td>{{ $order->user ? $order->user->name : 'Guest' }}</td>
                    <td>{{ $order->user ? $order->user->phone : 'N/A' }}</td>
                    <td>₹{{ number_format($order->total_amount, 2) }}</td>
                    <td>
                        <span class="badge bg-{{ $order->payment_status === 'paid' ? 'success' : 'warning' }}">
                            {{ ucfirst(str_replace('_', ' ', $order->payment_status)) }}
                        </span>
                    </td>
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
                    <td colspan="8" class="text-center text-muted py-4">No orders available.</td>
                </tr>
            @endforelse
        </tbody>
    </table>
</div>

<div class="mt-4">
    {{ $orders->links('pagination::bootstrap-5') }}
</div>
@endsection
