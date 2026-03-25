@extends('webadmin.layout.app')

@push('styles')
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
    #map {
        height: calc(100vh - 120px);
        width: 100%;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 1;
    }
</style>
@endpush

@section('content')
<div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
    <h1 class="h2">
        <i class="bi bi-geo-alt-fill text-danger me-2"></i> Live Tracking: Order #{{ $order->order_number ?? $order->id }}
    </h1>
    <div>
        <a href="{{ route('admin.orders.index') }}" class="btn btn-secondary btn-sm"><i class="bi bi-arrow-left"></i> Back to Orders</a>
    </div>
</div>

<div class="row">
    <!-- Left Sidebar: Order & Driver Details -->
    <div class="col-lg-3 tracking-sidebar pe-2">
        
        <!-- Live Status Alert -->
        <div class="alert alert-info py-2" role="alert">
            <div class="d-flex justify-content-between align-items-center">
                <strong><i class="bi bi-broadcast"></i> GPS Status:</strong>
                <span id="gpsStatusBadge" class="badge bg-warning text-dark">Connecting...</span>
            </div>
            <div class="small text-muted mt-1 text-end" id="lastUpdatedText">Waiting for ping...</div>
        </div>

        <!-- Driver Info Card -->
        <div class="card shadow-sm border-0 mb-3">
            <div class="card-header bg-dark text-white fw-bold">
                <i class="bi bi-bicycle me-2"></i> Delivery Partner
            </div>
            <div class="card-body p-3">
                <div class="d-flex align-items-center mb-3">
                    <img src="https://ui-avatars.com/api/?name={{ urlencode($order->driver->name ?? 'D P') }}&background=random" class="rounded-circle me-3" width="50" height="50" alt="Driver">
                    <div>
                        <h6 class="mb-0 fw-bold">{{ $order->driver->name ?? 'Unknown Driver' }}</h6>
                        <small class="text-muted"><i class="bi bi-telephone-fill"></i> {{ $order->driver->mobile_no ?? 'N/A' }}</small>
                    </div>
                </div>
            </div>
        </div>

        <!-- Customer Target Card -->
        <div class="card shadow-sm border-0 mb-3">
            <div class="card-header bg-danger text-white fw-bold">
                <i class="bi bi-house-door-fill me-2"></i> Delivery Destination
            </div>
            <div class="card-body p-3">
                <h6 class="fw-bold">{{ $order->customer_name }}</h6>
                <p class="small text-muted mb-2"><i class="bi bi-telephone-fill"></i> {{ $order->mobile_no }}</p>
                @php
                    $address = is_string($order->address) ? (json_decode($order->address, true) ?? $order->address) : $order->address;
                    $addressStr = is_array($address) ? collect($address)->implode(', ') : $address;
                @endphp
                <p class="small mb-0"><strong>Address:</strong><br>{{ $addressStr }}</p>
                
                @if(!($order->latitude ?? $order->user->latitude) || !($order->longitude ?? $order->user->longitude))
                    <div class="alert alert-warning py-1 px-2 mt-2 mb-0 small"><i class="bi bi-exclamation-triangle"></i> Customer GPS coordinates missing. Destination routing disabled.</div>
                @endif
            </div>
        </div>

        <!-- Order Summary Card -->
        <div class="card shadow-sm border-0">
            <div class="card-header bg-light fw-bold text-dark">
                <i class="bi bi-receipt me-2"></i> Order Summary
            </div>
            <ul class="list-group list-group-flush small">
                @foreach($order->items as $item)
                    <li class="list-group-item d-flex justify-content-between align-items-center px-3 py-2">
                        <span>{{ $item->quantity }}x {{ $item->product->name ?? 'Item' }}</span>
                        <span class="text-end fw-bold">₹{{ number_format($item->price * $item->quantity, 2) }}</span>
                    </li>
                @endforeach
                <li class="list-group-item d-flex justify-content-between align-items-center px-3 py-2 bg-light font-weight-bold">
                    <strong>Total Amount:</strong>
                    <strong>₹{{ number_format($order->total_amount, 2) }}</strong>
                </li>
            </ul>
        </div>
    </div>

    <!-- Right Container: Leaflet Map -->
    <div class="col-lg-9 ps-0">
        <div id="map"></div>
    </div>
</div>
@endsection

@push('scripts')
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
    let map;
    let driverMarker, destMarker;
    let routeLine;

    // Safely parse order coordinates
    const destLat = @json($order->latitude ?? ($order->user->latitude ?? null));
    const destLng = @json($order->longitude ?? ($order->user->longitude ?? null));
    const hasDestination = (destLat !== null && destLng !== null);

    document.addEventListener('DOMContentLoaded', function() {
        // 1. Initialize Leaflet Map
        const defaultLat = 34.0837; 
        const defaultLng = 74.7973;
        
        const initialLat = hasDestination ? destLat : defaultLat;
        const initialLng = hasDestination ? destLng : defaultLng;

        map = L.map('map').setView([initialLat, initialLng], 14);

        // 2. Add OpenStreetMap Tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // 3. Add Destination Marker
        if (hasDestination) {
            destMarker = L.marker([destLat, destLng], {
                icon: L.icon({
                    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2776/2776067.png', // Home Icon
                    iconSize: [35, 35],
                    iconAnchor: [17, 35]
                })
            }).addTo(map).bindPopup('<b>Customer Destination</b>');
        }

        // 4. Start Ping Cycle
        fetchDriverLocation();
        setInterval(fetchDriverLocation, 5000);
    });

    function fetchDriverLocation() {
        // Use root-relative URL to handle subdirectories correctly and avoid Mixed Content blocks
        fetch('{{ route('admin.orders.live-location', $order->id, false) }}')
            .then(res => {
                if (!res.ok) throw new Error("Server: " + res.status);
                return res.json();
            })
            .then(data => {
                let badge = document.getElementById('gpsStatusBadge');
                let statusText = document.getElementById('lastUpdatedText');
                
                if (data.success) {
                    const lat = parseFloat(data.lat);
                    const lng = parseFloat(data.lng);

                    // Update Badge Status
                    badge.className = data.is_online ? "badge bg-success" : "badge bg-warning text-dark";
                    badge.innerText = data.is_online ? "Active" : "Offline";
                    statusText.innerText = "Last update: " + data.last_updated;

                    // Update or Create Driver Marker
                    if (!driverMarker) {
                        driverMarker = L.marker([lat, lng], {
                            icon: L.icon({
                                iconUrl: 'https://cdn-icons-png.flaticon.com/512/1048/1048329.png', // Bike icon
                                iconSize: [40, 40],
                                iconAnchor: [20, 20]
                            })
                        }).addTo(map).bindPopup('<b>Driver Location</b>');

                        // Also center map if first time
                        if (!hasDestination) {
                             map.setView([lat, lng]);
                        }
                    } else {
                        driverMarker.setLatLng([lat, lng]);
                    }

                    // Update Connect Line
                    if (hasDestination) {
                        const points = [[lat, lng], [destLat, destLng]];
                        if (!routeLine) {
                            routeLine = L.polyline(points, { color: '#e63946', weight: 3, dashArray: '5, 10' }).addTo(map);
                        } else {
                            routeLine.setLatLngs(points);
                        }
                    }

                } else {
                    statusText.innerText = data.message;
                    badge.className = "badge bg-secondary";
                    badge.innerText = "No Signal";
                }
            })
            .catch(err => {
                document.getElementById('lastUpdatedText').innerText = "Network Error: " + err.message;
                document.getElementById('gpsStatusBadge').className = "badge bg-danger";
                document.getElementById('gpsStatusBadge').innerText = "No Signal";
                console.error("Error pinging driver GPS:", err);
            });
    }
</script>
@endpush
