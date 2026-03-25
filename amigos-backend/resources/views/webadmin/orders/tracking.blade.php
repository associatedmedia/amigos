@extends('webadmin.layout.app')

@push('styles')
<style>
    /* Full height map container */
    #trackingMap {
        height: calc(100vh - 120px);
        width: 100%;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
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

    <!-- Right Container: Google Map -->
    <div class="col-lg-9 ps-0">
        <div id="trackingMap"></div>
    </div>
</div>
@endsection

@push('scripts')
<!-- Load Google Maps Interface -->
<script async defer src="https://maps.googleapis.com/maps/api/js?key={{ env('GOOGLE_MAPS_API_KEY', env('GOOGLE_API_KEY')) }}&callback=initGoogleMap"></script>

<script>
    let map, driverMarker, destMarker, directionsService, directionsRenderer;
    // Safely parse order coordinates, falling back to registered user coordinates
    const destLat = @json($order->latitude ?? ($order->user->latitude ?? null));
    const destLng = @json($order->longitude ?? ($order->user->longitude ?? null));
    const hasDestination = (destLat !== null && destLng !== null);

    window.initGoogleMap = function() {
        // 1. Initialize Default Center
        let centerPoint = hasDestination ? { lat: destLat, lng: destLng } : { lat: 34.0837, lng: 74.7973 };
        
        map = new google.maps.Map(document.getElementById('trackingMap'), {
            zoom: 15,
            center: centerPoint,
            mapTypeId: 'roadmap',
            disableDefaultUI: false
        });

        // 2. Setup Routing Engine
        directionsService = new google.maps.DirectionsService();
        directionsRenderer = new google.maps.DirectionsRenderer({
            map: map,
            suppressMarkers: true, // We will use our custom markers
            polylineOptions: { strokeColor: '#0d6efd', strokeWeight: 6, strokeOpacity: 0.8 }
        });

        // 3. Mark Destination
        if (hasDestination) {
            destMarker = new google.maps.Marker({
                position: centerPoint,
                map: map,
                icon: {
                    url: 'https://cdn-icons-png.flaticon.com/512/25/25694.png',
                    scaledSize: new google.maps.Size(32, 32)
                },
                title: "Delivery Destination"
            });
        }


        // 4. Map loaded successfully
        console.log("Google Maps initialized.");
    };

    // 4. Start Ping Cycle immediately (don't wait for Google Maps to load)
    document.addEventListener('DOMContentLoaded', function() {
        fetchDriverLocation();
        setInterval(fetchDriverLocation, 5000);
    });

    function updateRoute(driverPos) {
        if (!hasDestination || !driverPos) return;

        let request = {
            origin: driverPos,
            destination: { lat: destLat, lng: destLng },
            travelMode: 'DRIVING'
        };

        directionsService.route(request, function(result, status) {
            if (status == 'OK') {
                directionsRenderer.setDirections(result);
            }
        });
    }

    function fetchDriverLocation() {
        fetch('{{ route('admin.orders.live-location', $order->id) }}')
            .then(res => res.json())
            .then(data => {
                let badge = document.getElementById('gpsStatusBadge');
                
                if (data.success) {
                    let latLng = { lat: parseFloat(data.lat), lng: parseFloat(data.lng) };
                    
                    if (!driverMarker) {
                        // Create Driver Marker on First Load
                        driverMarker = new google.maps.Marker({
                            position: latLng,
                            map: map,
                            icon: {
                                url: 'https://cdn-icons-png.flaticon.com/512/1986/1986937.png',
                                scaledSize: new google.maps.Size(40, 40)
                            },
                            title: "{{ $order->driver->name ?? 'Driver' }}"
                        });
                        if (!hasDestination) {
                            map.setCenter(latLng);
                        }
                    } else {
                        // Move marker instantly for live tracking
                        driverMarker.setPosition(latLng);
                    }

                    // Dynamically recalculate driving ETA/Route polyline
                    updateRoute(latLng);

                    // Update UI Stats
                    document.getElementById('lastUpdatedText').innerText = "Last update: " + data.last_updated;
                    if (data.is_online) {
                        badge.className = "badge bg-success";
                        badge.innerText = "Active";
                    } else {
                        badge.className = "badge bg-danger";
                        badge.innerText = "App Offline";
                    }
                } else {
                    document.getElementById('lastUpdatedText').innerText = data.message;
                    badge.className = "badge bg-secondary";
                    badge.innerText = "No Signal";
                }
            })
            .catch(err => console.error("Error pinging driver GPS:", err));
    }
</script>
@endpush
