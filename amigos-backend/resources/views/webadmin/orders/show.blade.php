@extends('webadmin.layout.app')

@section('content')
<div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
    <h1 class="h2">Order #{{ $order->id }} Details</h1>
    <a href="{{ route('admin.orders.index') }}" class="btn btn-secondary btn-sm"><i class="bi bi-arrow-left"></i> Back to Orders</a>
</div>

<div class="row">
    <div class="col-md-8">
        <div class="card shadow-sm border-0 mb-4">
            <div class="card-header bg-white fw-bold">Items Ordered</div>
            <div class="card-body p-0">
                <table class="table table-hover mb-0">
                    <thead class="table-light">
                        <tr>
                            <th>Item</th>
                            <th>Variety</th>
                            <th>Cost</th>
                            <th>Qty</th>
                            <th class="text-end">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($order->items as $item)
                            <tr>
                                <td>{{ $item->product ? $item->product->name : 'Unknown Product' }}</td>
                                <td>{{ $item->variety_name ?? 'Regular' }}</td>
                                <td>₹{{ number_format($item->variety_price, 2) }}</td>
                                <td>{{ $item->quantity }}</td>
                                <td class="text-end fw-bold">₹{{ number_format($item->variety_price * $item->quantity, 2) }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                    <tfoot class="table-light">
                        <tr>
                            <td colspan="4" class="text-end fw-bold">Subtotal:</td>
                            <td class="text-end fw-bold">₹{{ number_format($order->subtotal ?? $order->total_amount, 2) }}</td>
                        </tr>
                        @if($order->gst_amount > 0)
                        <tr>
                            <td colspan="4" class="text-end">GST:</td>
                            <td class="text-end">₹{{ number_format($order->gst_amount, 2) }}</td>
                        </tr>
                        @endif
                        @if($order->delivery_fee > 0)
                        <tr>
                            <td colspan="4" class="text-end">Delivery Fee:</td>
                            <td class="text-end">₹{{ number_format($order->delivery_fee, 2) }}</td>
                        </tr>
                        @endif
                        <tr>
                            <td colspan="4" class="text-end fw-bold fs-5">Grand Total:</td>
                            <td class="text-end fw-bold text-success fs-5">₹{{ number_format($order->total_amount, 2) }}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    </div>
    
    <div class="col-md-4">
        <div class="card shadow-sm border-0 mb-4">
            <div class="card-header bg-white fw-bold">Customer Information</div>
            <div class="card-body">
                <p><strong>Name:</strong> {{ $order->user ? $order->user->name : 'Guest' }}</p>
                <p><strong>Phone:</strong> {{ $order->user ? $order->user->phone : 'N/A' }}</p>
                <p><strong>Email:</strong> {{ $order->user ? $order->user->email : 'N/A' }}</p>
            </div>
        </div>

        <div class="card shadow-sm border-0 mb-4">
            <div class="card-header bg-white fw-bold">Delivery Location</div>
            <div class="card-body">
                @if($order->location)
                    @php $loc = is_string($order->location) ? json_decode($order->location, true) : $order->location; @endphp
                    <p>{{ $loc['address'] ?? ($order->location_address ?? 'Address not found') }}</p>
                @elseif($order->address)
                    <p>{{ is_string($order->address) ? collect(json_decode($order->address, true))->implode(', ') : 'N/A' }}</p>
                @else
                    <p class="text-muted">No specific location provided.</p>
                @endif
            </div>
        </div>
        
        <div class="card shadow-sm border-0">
            <div class="card-header bg-white fw-bold">Payment Details</div>
            <div class="card-body">
                <p><strong>Method:</strong> <span class="badge bg-info text-dark">{{ strtoupper(str_replace('_', ' ', $order->payment_method)) }}</span></p>
                <p><strong>Status:</strong> <span class="badge bg-{{ $order->payment_status === 'paid' ? 'success' : 'warning' }}">{{ ucfirst($order->payment_status) }}</span></p>
                @if($order->payment_id)
                <p><strong>Transaction ID:</strong> <br><small class="text-muted">{{ $order->payment_id }}</small></p>
                @endif
            </div>
        </div>
    </div>
</div>
@endsection
