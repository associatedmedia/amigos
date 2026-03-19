@extends('webadmin.layout.app')

@push('scripts')
<style>
    /* Styling for the Print KOT explicitly */
    @media print {
        /* Hide everything by default */
        body { visibility: hidden; }
        
        /* Only show the Items Ordered card */
        .print-section, .print-section * {
            visibility: visible;
        }
        
        /* Position the Items card at the top left of the printed page */
        .print-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
        }

        /* Hide the card header, as it's not needed for a KOT */
        .print-section .card-header {
            display: none !important;
        }

        /* Add a KOT Header */
        .print-section::before {
            content: "AMIGOS PIZZA KOT - Order #{{ $order->id }}\A Date: {{ $order->created_at->format('M d, Y h:i A') }}";
            white-space: pre-wrap;
            display: block;
            text-align: center;
            font-weight: bold;
            font-size: 1.5rem;
            margin-bottom: 20px;
        }
    }
</style>
<style>
    /* Hide the receipt on the normal computer screen */
    @media screen {
        #thermal-receipt {
            display: none;
        }
    }

    /* Strict Thermal Printer Settings */
    @media print {
        /* 1. Hide the entire admin panel */
        body * {
            visibility: hidden;
        }

        /* 2. Set the exact paper size for 79mm/80mm rolls */
        @page {
            size: 79mm auto; /* 79mm width, auto length to prevent blank pages */
            margin: 0; /* Remove default browser margins */
        }

        /* 3. Show ONLY the receipt and reset its position */
        #thermal-receipt, #thermal-receipt * {
            visibility: visible;
        }

        #thermal-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 79mm;
            max-width: 79mm;
            padding: 2mm 4mm; /* Slight padding so text doesn't touch the exact edge */
            font-family: 'Courier New', Courier, monospace; /* Monospace is standard for POS */
            font-size: 13px;
            line-height: 1.2;
            color: #000;
            background: #fff;
        }

        /* 4. Receipt Specific Styling */
        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        
        .divider {
            border-bottom: 1px dashed #000;
            margin: 5px 0;
        }

        h2, h3, h4, p {
            margin: 2px 0;
            padding: 0;
        }

        /* Table strict layout to prevent 79mm overflow */
        .receipt-table {
            width: 100%;
            border-collapse: collapse;
        }
        .receipt-table th, .receipt-table td {
            padding: 3px 0;
            vertical-align: top;
        }
        .col-qty { width: 15%; }
        .col-item { width: 60%; padding-right: 5px; word-wrap: break-word; }
        .col-price { width: 25%; text-align: right; }

        .flex-between {
            display: flex;
            justify-content: space-between;
            margin-bottom: 2px;
        }
    }
</style>
@endpush

@section('content')
<div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom d-print-none">
    <h1 class="h2">Order #{{ $order->order_number ?? $order->id }} Details</h1>
    <div>
        <a href="{{ route('admin.orders.printKOT', $order->id) }}" class="btn btn-success btn-sm me-2"><i class="bi bi-printer-fill"></i> QUEUE PRINT</a>
        <button onclick="window.print()" class="btn btn-primary btn-sm me-2"><i class="bi bi-printer"></i> Browser Print</button>
        <a href="{{ route('admin.orders.index') }}" class="btn btn-secondary btn-sm"><i class="bi bi-arrow-left"></i> Back to Orders</a>
    </div>
</div>

<div class="row">
    <div class="col-md-8">
        <div class="card shadow-sm border-0 mb-4 print-section---">
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
                                <td>{{ $item->product ? $item->product->name : 'Unknown Product' }} - {{ $item->old_db_code }}</td>
                                <td>{{ $item->variety_name ?? 'Regular' }}</td>
                                <td>{{ $item->quantity }}</td>
                                <td class="text-end fw-bold">₹{{ number_format($item->price * $item->quantity, 2) }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                    <tfoot class="table-light">
                        <tr>
                            <td colspan="3" class="text-end fw-bold">Subtotal:</td>
                            <td class="text-end fw-bold">₹{{ number_format($order->total_amount - $order->delivery_fee, 2) }}</td>
                        </tr>
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
                        @if($order->gst_amount > 0)
                        <tr>
                            <td colspan="4" class="text-end text-muted small">(Includes GST: ₹{{ number_format($order->gst_amount, 2) }})</td>
                        </tr>
                        @endif
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
                @if($order->platform)
                <hr>
                <p class="mb-0"><strong>Placed Via:</strong> 
                    @if(strtolower($order->platform) === 'ios')
                        <span class="badge bg-secondary"><i class="bi bi-apple"></i> iOS App</span>
                    @elseif(strtolower($order->platform) === 'android')
                        <span class="badge bg-success"><i class="bi bi-android2"></i> Android App</span>
                    @else
                        <span class="badge bg-secondary"><i class="bi bi-globe"></i> {{ ucfirst($order->platform) }}</span>
                    @endif
                </p>
                @endif
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
                            @foreach($orderStatuses as $statusOp)
                                <option value="{{ $statusOp->status_code }}" {{ $order->status == $statusOp->status_code ? 'selected' : '' }}>
                                    {{ $statusOp->label }}
                                </option>
                            @endforeach
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

        <div class="card shadow-sm border-0 mb-4">
            <div class="card-header bg-white fw-bold">Delivery Location</div>
            <div class="card-body">
                @if($order->address)
                    @php
                        $decodedAddress = json_decode($order->address, true);
                    @endphp
                    <p class="mb-3">{{ is_array($decodedAddress) ? collect($decodedAddress)->implode(', ') : $order->address }}</p>
                @else
                    <p class="text-muted mb-3">No specific textual address provided.</p>
                @endif

                @if($order->latitude && $order->longitude)
                    <h6 class="fw-bold fs-6 mt-3">GPS Coordinates:</h6>
                    <div class="d-flex align-items-center justify-content-between p-2 bg-light rounded border">
                        <div class="small font-monospace text-muted">
                            {{ $order->latitude }}, {{ $order->longitude }}
                        </div>
                        <a href="https://maps.google.com/?q={{ $order->latitude }},{{ $order->longitude }}" target="_blank" class="btn btn-sm btn-outline-danger">
                            <i class="bi bi-geo-alt-fill"></i> View on Maps
                        </a>
                    </div>
                @else
                    <div class="alert alert-warning py-2 mb-0 mt-3 small">
                        <i class="bi bi-exclamation-circle"></i> No GPS Coordinates tracked for this order.
                    </div>
                @endif
            </div>
        </div>
        
        <div class="card shadow-sm border-0">
            <div class="card-header bg-white fw-bold">Payment Details</div>
            <div class="card-body">
                <p><strong>Method:</strong> <span class="badge bg-info text-dark">{{ strtoupper(str_replace('_', ' ', $order->payment_method)) }}</span></p>
                <p><strong>Status:</strong> <span class="badge bg-{{ $order->payment_status === 'paid' ? 'success' : 'warning' }}">{{ ucfirst($order->payment_status) }}</span></p>
                @if($order->payment_id && $order->payment_method === 'razorpay')
                <p><strong>Razorpay Payment ID:</strong> <br><small class="text-muted font-monospace">{{ $order->payment_id }}</small></p>
                @elseif($order->payment_id)
                <p><strong>Transaction ID:</strong> <br><small class="text-muted font-monospace">{{ $order->payment_id }}</small></p>
                @endif
            </div>
        </div>
    </div>
</div>

<!-- PRINTER SETUP --->

<div id="thermal-receipt">
    <div class="text-center font-bold">
        <h2 style="font-size: 18px;">AMIGOS PIZZA</h2>
        <h4>KITCHEN ORDER TICKET</h4>
    </div>
    <div class="divider"></div>
    
    <div>
        <p><span class="font-bold">Order #:</span> {{ $order->order_number ?? $order->id }}</p>
        <p><span class="font-bold">Date:</span> {{ $order->created_at->format('d/m/Y h:i A') }}</p>
        {{-- <p><span class="font-bold">Type:</span> {{ ucfirst($order->platform ?? 'Walk-in') }}</p> --}}
        <p><span class="font-bold">Customer:</span> {{ $order->user ? $order->user->name : 'Guest' }}</p>
        {{-- @if($order->user && $order->user->mobile_no)
            <p><span class="font-bold">Phone:</span> {{ $order->user->mobile_no }}</p>
        @endif --}}
    </div>
    
    <div class="divider"></div>
    
    <table class="receipt-table">
        <thead>
            <tr class="divider">
                <th class="text-left col-qty">Qty</th>
                <th class="text-left col-item">Item</th>
                <th class="text-right col-price">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($order->items as $item)
            <tr>
                <td class="col-qty font-bold">{{ $item->quantity }}x</td>
                <td class="col-item">
                    {{ $item->product ? $item->product->name : 'Unknown' }}
                    @if($item->variety_name)
                        <br><small style="font-size: 11px;">- {{ $item->variety_name }}</small>
                    @endif
                </td>
                <td class="col-price">₹{{ number_format($item->price * $item->quantity, 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    
    <div class="divider"></div>
    
    <div>
        <div class="flex-between">
            <span>Subtotal:</span>
            <span>₹{{ number_format($order->total_amount - $order->delivery_fee, 2) }}</span>
        </div>
        @if($order->delivery_fee > 0)
        <div class="flex-between">
            <span>Delivery:</span>
            <span>₹{{ number_format($order->delivery_fee, 2) }}</span>
        </div>
        @endif
        <div class="divider"></div>
        <div class="flex-between font-bold" style="font-size: 15px;">
            <span>TOTAL:</span>
            <span>₹{{ number_format($order->total_amount, 2) }}</span>
        </div>
        @if($order->gst_amount > 0)
        <div class="flex-between" style="font-size: 11px;">
            <span>(Includes GST:</span>
            <span>₹{{ number_format($order->gst_amount, 2) }})</span>
        </div>
        @endif
    </div>
    
    <div class="divider"></div>
    
    <div class="text-center mt-2">
        <p>*** END OF TICKET ***</p>
        <br><br><br> </div>
</div>

@endsection
