@extends('webadmin.layout.app')

@push('scripts')
<style>
    /* Retained fallback 80mm CSS for browser printing if ever needed */
    @media print {
        @page {
            margin: 0;
            size: 80mm 297mm;
        }
        body { visibility: hidden; width: 80mm; margin: 0; padding: 0; }
        .print-section, .print-section * { visibility: visible; }
        .print-section {
            position: absolute; left: 0; top: 0; width: 100%;
            margin: 0 !important; padding: 0 !important;
            box-shadow: none !important; border: none !important;
            font-family: monospace;
        }
        .print-section .card-header { display: none !important; }
        .print-section::before {
            content: "AMIGOS PIZZA KOT - #{{ $order->id }}\A Date: {{ $order->created_at->format('M d, Y h:i A') }}";
            white-space: pre-wrap; display: block; text-align: center;
            font-weight: bold; font-size: 1.2rem; margin-bottom: 15px;
        }
    }
</style>
@endpush

@section('content')

{{-- Display Success/Error Messages for Printing --}}
@if(session('success'))
    <div class="alert alert-success alert-dismissible fade show" role="alert">
        {{ session('success') }}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
@endif

@if(session('error'))
    <div class="alert alert-danger alert-dismissible fade show" role="alert">
        {{ session('error') }}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
@endif

<div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom d-print-none">
    <h1 class="h2">Order #{{ $order->order_number ?? $order->id }} Details</h1>
    <div>
        {{-- Updated Print Button: Now hits the direct print route --}}
        <a href="{{ route('admin.orders.printKOT', $order->id) }}" class="btn btn-primary btn-sm me-2">
            <i class="bi bi-printer"></i> Direct Print KOT
        </a>
        <a href="{{ route('admin.orders.index') }}" class="btn btn-secondary btn-sm">
            <i class="bi bi-arrow-left"></i> Back to Orders
        </a>
    </div>
</div>

<div class="row">
    <div class="col-md-8">
        <div class="card shadow-sm border-0 mb-4 print-section">
            <div class="card-header bg-white fw-bold">Items Ordered</div>
            <div class="card-body p-0">
                <table class="table table-hover mb-0">
                    <thead class="table-light">
                        <tr>
                            <th>Item</th>
                            <th>Variety</th>
                            <th>Qty</th>
                            <th class="text-end">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($order->items as $item)
                            <tr>
                                <td>{{ $item->product ? $item->product->name : 'Unknown Product' }}</td>
                                <td>{{ $item->variety_name ?? 'Regular' }}</td>
                                <td>{{ $item->quantity }}</td>
                                <td class="text-end fw-bold">₹{{ number_format($item->price * $item->quantity, 2) }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                    <tfoot class="table-light">
                        <tr>
                            <td colspan="3" class="text-end fw-bold">Subtotal:</td>
                            <td class="text-end fw-bold">₹{{ number_format($order->total_amount, 2) }}</td>
                        </tr>
                        @if($order->gst_amount > 0)
                        <tr>
                            <td colspan="3" class="text-end">GST:</td>
                            <td class="text-end">₹{{ number_format($order->gst_amount, 2) }}</td>
                        </tr>
                        @endif
                        @if($order->delivery_fee > 0)
                        <tr>
                            <td colspan="3" class="text-end">Delivery Fee:</td>
                            <td class="text-end">₹{{ number_format($order->delivery_fee, 2) }}</td>
                        </tr>
                        @endif
                        <tr>
                            <td colspan="3" class="text-end fw-bold fs-5">Grand Total:</td>
                            <td class="text-end fw-bold text-success fs-5">₹{{ number_format($order->total_amount, 2) }}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    </div>
    
    <div class="col-md-4 d-print-none">
        <div class="card shadow-sm border-0 mb-4">
            <div class="card-header bg-white fw-bold">Customer Information</div>
            <div class="card-body">
                <p><strong>Name:</strong> {{ $order->user ? $order->user->name : 'N/A' }}</p>
                <p><strong>Phone:</strong> {{ $order->user ? $order->user->mobile_no : 'N/A' }}</p>
                <hr>
                <p class="mb-0"><strong>Store:</strong> 
                    @if($order->store_id == 0)
                        Srinagar
                    @else
                        Anantnag
                    @endif
                </p>
            </div>
        </div>

        <div class="card shadow-sm border-0 mb-4">
            <div class="card-header bg-white fw-bold">Update Order Status</div>
            <div class="card-body">
                <form action="{{ route('admin.orders.updateStatus', $order->id) }}" method="POST">
                    @csrf
                    @method('PUT')
                    <div class="input-group">
                        <select name="status" class="form-select" required>
                            <option value="pending" {{ $order->status == 'pending' ? 'selected' : '' }}>Pending</option>
                            <option value="accepted" {{ $order->status == 'accepted' ? 'selected' : '' }}>Accepted</option>
                            <option value="assigned" {{ $order->status == 'assigned' ? 'selected' : '' }}>Assigned</option>
                            <option value="picked_up" {{ $order->status == 'picked_up' ? 'selected' : '' }}>Picked Up</option>
                            <option value="delivered" {{ $order->status == 'delivered' ? 'selected' : '' }}>Delivered</option>
                            <option value="cancelled" {{ $order->status == 'cancelled' ? 'selected' : '' }}>Cancelled</option>
                        </select>
                        <button class="btn btn-primary" type="submit">Update</button>
                    </div>
                </form>
            </div>
        </div>

        <div class="card shadow-sm border-0 mb-4">
            <div class="card-header bg-white fw-bold">Assign Delivery Boy</div>
            <div class="card-body">
                <form action="{{ route('admin.orders.assignDriver', $order->id) }}" method="POST">
                    @csrf
                    @method('PUT')
                    <div class="input-group">
                        <select name="driver_id" class="form-select" required>
                            <option value="">-- Select Delivery Boy --</option>
                            @foreach($drivers as $driver)
                                <option value="{{ $driver->id }}" {{ $order->driver_id == $driver->id ? 'selected' : '' }}>
                                    {{ $driver->name }} ({{ $driver->mobile_no }})
                                </option>
                            @endforeach
                        </select>
                        <button class="btn btn-success" type="submit">Assign</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
@endsection