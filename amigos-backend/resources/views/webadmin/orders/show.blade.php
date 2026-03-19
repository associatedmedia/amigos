@extends('webadmin.layout.app')

@push('scripts')
<style>
    @media print {
        body * { visibility: hidden; }
        #thermal-receipt, #thermal-receipt * { visibility: visible; }
        @page { size: 79mm auto; margin: 0; }
        #thermal-receipt {
            position: absolute; left: 0; top: 0;
            width: 79mm; max-width: 79mm;
            padding: 2mm 4mm;
            font-family: 'Courier New', Courier, monospace;
            font-size: 13px; line-height: 1.3; color: #000; background: #fff;
        }
        .text-center { text-align: center; }
        .font-bold   { font-weight: bold; }
        .divider     { border-bottom: 1px dashed #000; margin: 5px 0; }
        .flex-between { display: flex; justify-content: space-between; margin-bottom: 2px; }
        .receipt-table { width: 100%; border-collapse: collapse; }
        .receipt-table th, .receipt-table td { padding: 3px 0; vertical-align: top; }
        .col-qty   { width: 15%; }
        .col-item  { width: 60%; padding-right: 5px; word-wrap: break-word; }
        .col-price { width: 25%; text-align: right; }
    }
</style>
@endpush

@section('content')
<div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom d-print-none">
    <h1 class="h2">Order #{{ $order->order_number ?? $order->id }}</h1>
    <div class="d-flex gap-2">
        <a href="{{ route('admin.orders.printKOT', $order->id) }}" class="btn btn-success btn-sm">
            <i class="bi bi-printer-fill"></i> Queue Print
        </a>
        <button onclick="window.print()" class="btn btn-primary btn-sm">
            <i class="bi bi-printer"></i> Browser Print
        </button>
        <a href="{{ route('admin.orders.edit', $order->id) }}" class="btn btn-warning btn-sm">
            <i class="bi bi-pencil"></i> Edit Order
        </a>
        {{-- ← Returns to the SAME page the user was on --}}
        <a href="javascript:history.back()" class="btn btn-secondary btn-sm">
            <i class="bi bi-arrow-left"></i> Back to Orders
        </a>
    </div>
</div>

<div class="row d-print-none">
    {{-- ── Left: Items ─────────────────────────────── --}}
    <div class="col-md-8">
        <div class="card shadow-sm border-0 mb-4">
            <div class="card-header bg-white fw-bold d-flex justify-content-between align-items-center">
                <span>Items Ordered</span>
                <span class="badge bg-secondary">{{ $order->items->count() }} item(s)</span>
            </div>
            <div class="card-body p-0">
                <table class="table table-hover mb-0">
                    <thead class="table-light">
                        <tr>
                            <th>Item</th>
                            <th>Variety</th>
                            <th class="text-center">Qty</th>
                            <th class="text-end">Price</th>
                            <th class="text-end">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($order->items as $item)
                        <tr>
                            <td>{{ $item->product ? $item->product->name : 'Unknown Product' }}</td>
                            <td>{{ $item->variety_name ?? '—' }}</td>
                            <td class="text-center">{{ $item->quantity }}</td>
                            <td class="text-end">₹{{ number_format($item->price, 2) }}</td>
                            <td class="text-end fw-bold">₹{{ number_format($item->price * $item->quantity, 2) }}</td>
                        </tr>
                        @endforeach
                    </tbody>
                    <tfoot class="table-light">
                        @php $subtotal = $order->total_amount - ($order->delivery_fee ?? 0); @endphp
                        <tr>
                            <td colspan="4" class="text-end">Subtotal</td>
                            <td class="text-end">₹{{ number_format($subtotal, 2) }}</td>
                        </tr>
                        @if(($order->delivery_fee ?? 0) > 0)
                        <tr>
                            <td colspan="4" class="text-end text-muted">Delivery Fee</td>
                            <td class="text-end text-muted">₹{{ number_format($order->delivery_fee, 2) }}</td>
                        </tr>
                        @endif
                        <tr>
                            <td colspan="4" class="text-end fw-bold fs-6">Grand Total</td>
                            <td class="text-end fw-bold text-success fs-6">₹{{ number_format($order->total_amount, 2) }}</td>
                        </tr>
                        @if(($order->gst_amount ?? 0) > 0)
                        <tr>
                            <td colspan="5" class="text-end text-muted small">
                                (Incl. GST: ₹{{ number_format($order->gst_amount, 2) }})
                            </td>
                        </tr>
                        @endif
                    </tfoot>
                </table>
            </div>
        </div>
    </div>

    {{-- ── Right: Controls ─────────────────────────── --}}
    <div class="col-md-4">

        {{-- Customer Info --}}
        <div class="card shadow-sm border-0 mb-3">
            <div class="card-header bg-white fw-bold">Customer</div>
            <div class="card-body py-2">
                <table class="table table-sm table-borderless mb-0">
                    <tr><td class="text-muted" style="width:90px">Name</td><td class="fw-bold">{{ $order->user->name ?? 'Guest' }}</td></tr>
                    <tr><td class="text-muted">Phone</td><td>{{ $order->user->mobile_no ?? $order->mobile_no ?? '—' }}</td></tr>
                    <tr><td class="text-muted">Store</td><td>{{ ($order->store_id == 0) ? 'Srinagar' : 'Anantnag' }}</td></tr>
                    @if($order->platform)
                    <tr>
                        <td class="text-muted">Via</td>
                        <td>
                            @if(strtolower($order->platform) === 'ios')
                                <i class="bi bi-apple"></i> iOS
                            @elseif(strtolower($order->platform) === 'android')
                                <i class="bi bi-android2 text-success"></i> Android
                            @else
                                <i class="bi bi-globe text-secondary"></i> {{ ucfirst($order->platform) }}
                            @endif
                        </td>
                    </tr>
                    @endif
                </table>
            </div>
        </div>

        {{-- Update Status --}}
        <div class="card shadow-sm border-0 mb-3">
            <div class="card-header bg-white fw-bold">Update Status</div>
            <div class="card-body">
                <form action="{{ route('admin.orders.updateStatus', $order->id) }}" method="POST">
                    @csrf @method('PUT')
                    <div class="input-group">
                        <select name="status" class="form-select form-select-sm" required>
                            @foreach($orderStatuses as $s)
                                <option value="{{ $s->status_code }}" {{ $order->status === $s->status_code ? 'selected' : '' }}>
                                    {{ $s->label }}
                                </option>
                            @endforeach
                        </select>
                        <button class="btn btn-sm btn-primary" type="submit">Update</button>
                    </div>
                </form>
            </div>
        </div>

        {{-- Assign Driver --}}
        <div class="card shadow-sm border-0 mb-3">
            <div class="card-header bg-white fw-bold">Assign Delivery Boy</div>
            <div class="card-body">
                <form action="{{ route('admin.orders.assignDriver', $order->id) }}" method="POST">
                    @csrf @method('PUT')
                    <div class="input-group">
                        <select name="driver_id" class="form-select form-select-sm" required>
                            <option value="">— Select —</option>
                            @foreach($drivers as $d)
                                <option value="{{ $d->id }}" {{ $order->driver_id == $d->id ? 'selected' : '' }}>
                                    {{ $d->name }} ({{ $d->mobile_no }})
                                </option>
                            @endforeach
                        </select>
                        <button class="btn btn-sm btn-success" type="submit">Assign</button>
                    </div>
                </form>
            </div>
        </div>

        {{-- Delivery Location --}}
        <div class="card shadow-sm border-0 mb-3">
            <div class="card-header bg-white fw-bold">Delivery Location</div>
            <div class="card-body">
                @if($order->address)
                    @php
                        $addr = json_decode($order->address, true);
                        $displayAddr = is_array($addr) ? collect($addr)->implode(', ') : $order->address;
                    @endphp
                    <p class="small mb-2">{{ $displayAddr }}</p>
                @endif

                @if($order->latitude && $order->longitude)
                    <a href="https://maps.google.com/?q={{ $order->latitude }},{{ $order->longitude }}"
                       target="_blank" class="btn btn-sm btn-outline-danger w-100">
                        <i class="bi bi-geo-alt-fill"></i> View on Maps
                    </a>
                @else
                    <p class="text-muted small mb-0">No GPS coordinates</p>
                @endif
            </div>
        </div>

        {{-- Payment --}}
        <div class="card shadow-sm border-0 mb-3">
            <div class="card-header bg-white fw-bold">Payment</div>
            <div class="card-body py-2">
                <table class="table table-sm table-borderless mb-0">
                    <tr>
                        <td class="text-muted" style="width:80px">Method</td>
                        <td><span class="badge bg-info text-dark">{{ strtoupper(str_replace('_', ' ', $order->payment_method)) }}</span></td>
                    </tr>
                    <tr>
                        <td class="text-muted">Status</td>
                        <td>
                            <span class="badge bg-{{ ($order->payment_status === 'paid') ? 'success' : 'warning' }}">
                                {{ ucfirst($order->payment_status) }}
                            </span>
                        </td>
                    </tr>
                    @if($order->payment_id)
                    <tr>
                        <td class="text-muted">Txn ID</td>
                        <td class="small font-monospace text-muted">{{ $order->payment_id }}</td>
                    </tr>
                    @endif
                </table>
            </div>
        </div>

    </div>
</div>

{{-- ── Thermal Receipt (print only) ───────────────────────────────── --}}
<div id="thermal-receipt">
    <div class="text-center font-bold">
        <p style="font-size:16px;font-weight:bold">AMIGOS PIZZA</p>
        <p>KITCHEN ORDER TICKET</p>
    </div>
    <div class="divider"></div>
    <p><span class="font-bold">Order #:</span> {{ $order->order_number ?? $order->id }}</p>
    <p><span class="font-bold">Date:</span> {{ $order->created_at->format('d/m/Y h:i A') }}</p>
    <p><span class="font-bold">Customer:</span> {{ $order->user->name ?? $order->customer_name ?? 'Guest' }}</p>
    @if($order->mobile_no)<p><span class="font-bold">Phone:</span> {{ $order->mobile_no }}</p>@endif
    <div class="divider"></div>
    <table class="receipt-table">
        <thead>
            <tr>
                <th class="col-qty">Qty</th>
                <th class="col-item">Item</th>
                <th class="col-price">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($order->items as $item)
            <tr>
                <td class="col-qty font-bold">{{ $item->quantity }}x</td>
                <td class="col-item">
                    {{ $item->product ? $item->product->name : 'Unknown' }}
                    @if($item->variety_name)<br><small>- {{ $item->variety_name }}</small>@endif
                </td>
                <td class="col-price">₹{{ number_format($item->price * $item->quantity, 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    <div class="divider"></div>
    <div class="flex-between font-bold" style="font-size:15px">
        <span>TOTAL:</span>
        <span>₹{{ number_format($order->total_amount, 2) }}</span>
    </div>
    <div class="divider"></div>
    <div class="text-center"><p>*** END OF TICKET ***</p><br><br></div>
</div>
@endsection