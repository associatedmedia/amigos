@extends('webadmin.layout.app')

@push('styles')
<!-- Standard Leaflet CSS -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<!-- Leaflet Routing Machine CSS -->
<link rel="stylesheet" href="https://unpkg.com/leaflet-routing-machine@latest/dist/leaflet-routing-machine.css" />
<style>
    /* Full height map container */
    #trackingMap {
        height: calc(100vh - 120px);
        width: 100%;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 1;
    }
    
    /* Hide the built-in routing machine text itinerary, we only want the map line */
    .leaflet-routing-container {
        display: none !important;
    }
    
    .tracking-sidebar {
        height: calc(100vh - 120px);
        overflow-y: auto;
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
                
                @if(!$order->latitude || !$order->longitude)
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

    <!-- Right Container: Map -->
    <div class="col-lg-9 ps-0">
        <div id="trackingMap"></div>
    </div>
</div>
@endsection

@push('scripts')
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="https://unpkg.com/leaflet-routing-machine@latest/dist/leaflet-routing-machine.js"></script>

<script>
    document.addEventListener('DOMContentLoaded', function () {
        
        // Coordinates for Customer Destination
        const destLat = {{ $order->latitude ?? 'null' }};
        const destLng = {{ $order->longitude ?? 'null' }};
        const hasDestination = (destLat !== null && destLng !== null);

        // Initialize Map (Default view: Srinagar)
        var centerLat = hasDestination ? destLat : 34.0837;
        var centerLng = hasDestination ? destLng : 74.7973;
        var map = L.map('trackingMap').setView([centerLat, centerLng], 14);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
        }).addTo(map);

        // Define Icons
        var driverIcon = L.icon({
            iconUrl: 'https://cdn-icons-png.flaticon.com/512/1986/1986937.png', // Delivery Bike
            iconSize: [42, 42],
            iconAnchor: [21, 42],
            popupAnchor: [0, -42]
        });

        var homeIcon = L.icon({
            iconUrl: 'https://cdn-icons-png.flaticon.com/512/25/25694.png', // Home/Flag
            iconSize: [36, 36],
            iconAnchor: [18, 36],
            popupAnchor: [0, -36]
        });

        // Setup Destination Marker
        var destLocation = null;
        if (hasDestination) {
            destLocation = L.latLng(destLat, destLng);
            L.marker(destLocation, {icon: homeIcon}).addTo(map)
             .bindPopup("<b>Delivery Destination</b>");
        }

        var driverMarker = null;
        var routingControl = null;

        function updateRoute(driverLatLng) {
            // Only plot route if we have a destination AND a driver location
            if (!hasDestination || !destLocation || !driverLatLng) return;

            if (!routingControl) {
                // First time creating the route
                routingControl = L.Routing.control({
                    waypoints: [
                        driverLatLng,
                        destLocation
                    ],
                    // We only want to display the line, not the driving directions popup
                    routeWhileDragging: false,
                    showAlternatives: false,
                    fitSelectedRoutes: true,
                    createMarker: function() { return null; }, // We already made our own markers
                    lineOptions: {
                        styles: [{color: '#0d6efd', opacity: 0.8, weight: 6}] // Blue path
                    }
                }).addTo(map);
            } else {
                // Update the starting point dynamically as driver moves
                routingControl.spliceWaypoints(0, 1, driverLatLng);
            }
        }

        // Fetch driver data via AJAX
        function fetchDriverLocation() {
            fetch('{{ route('admin.orders.live-location', $order->id) }}')
                .then(response => response.json())
                .then(data => {
                    let badge = document.getElementById('gpsStatusBadge');
                    
                    if (data.success) {
                        var latLng = L.latLng(data.lat, data.lng);
                        
                        // Update/Create Driver Marker
                        if (!driverMarker) {
                            driverMarker = L.marker(latLng, {icon: driverIcon, zIndexOffset: 1000}).addTo(map);
                            driverMarker.bindPopup("<b>{{ $order->driver->name ?? 'Delivery Partner' }}</b>").openPopup();
                            
                            // If no destination exists, center on the driver
                            if (!hasDestination) {
                                map.setView(latLng, 16);
                            }
                        } else {
                            // Smoothly move the marker to new coordinates
                            driverMarker.setLatLng(latLng);
                        }

                        // Update the dynamic polyline route
                        updateRoute(latLng);

                        // Update Dashboard Status
                        document.getElementById('lastUpdatedText').innerText = "Last update: " + data.last_updated;
                        if (data.is_online) {
                            badge.className = "badge bg-success";
                            badge.innerText = "Active & Tracking";
                        } else {
                            badge.className = "badge bg-danger";
                            badge.innerText = "Driver App Offline";
                        }
                    } else {
                        document.getElementById('lastUpdatedText').innerText = data.message;
                        badge.className = "badge bg-secondary";
                        badge.innerText = "No Signal";
                    }
                })
                .catch(error => console.error('Error fetching tracker data:', error));
        }

        // Start Ping Cycle
        fetchDriverLocation();
        setInterval(fetchDriverLocation, 5000); // Pulse every 5 seconds
    });
</script>
@endpush
