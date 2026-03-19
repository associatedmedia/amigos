@extends('webadmin.layout.app')

@section('title', 'Orders')

@section('content')
<div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
    <h1 class="h2">Orders</h1>
    <a href="{{ route('admin.orders.create') }}" class="btn btn-sm btn-primary">
        <i class="bi bi-plus-circle"></i> Add Order
    </a>
</div>

{{-- Quick filter tabs --}}
<ul class="nav nav-tabs mb-3" id="orderFilterTabs">
    <li class="nav-item">
        <a class="nav-link active" href="#" data-filter="">All Orders</a>
    </li>
    <li class="nav-item">
        <a class="nav-link" href="#" data-filter="pending">Pending</a>
    </li>
    <li class="nav-item">
        <a class="nav-link" href="#" data-filter="cooking">Cooking</a>
    </li>
    <li class="nav-item">
        <a class="nav-link" href="#" data-filter="out_for_delivery">Out for Delivery</a>
    </li>
    <li class="nav-item">
        <a class="nav-link" href="#" data-filter="delivered">Delivered</a>
    </li>
    <li class="nav-item">
        <a class="nav-link" href="#" data-filter="cancelled">Cancelled</a>
    </li>
</ul>

<div class="table-responsive bg-white p-3 rounded shadow-sm border">
    <table class="table table-hover align-middle w-100" id="ordersTable">
        <thead class="table-light">
            <tr>
                <th>Order #</th>
                <th>Source</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
            </tr>
        </thead>
    </table>
</div>
@endsection

@push('scripts')
<script>
$(document).ready(function () {

    // ── 1. Restore saved page/search/filter from sessionStorage ──────────
    var savedPage   = parseInt(sessionStorage.getItem('orders_page'))   || 1;
    var savedSearch = sessionStorage.getItem('orders_search')           || '';
    var savedFilter = sessionStorage.getItem('orders_status_filter')    || '';
    var savedLength = parseInt(sessionStorage.getItem('orders_length')) || 25;

    // ── 2. Highlight the correct tab ────────────────────────────────────
    $('#orderFilterTabs .nav-link').each(function () {
        if ($(this).data('filter') === savedFilter) {
            $('#orderFilterTabs .nav-link').removeClass('active');
            $(this).addClass('active');
        }
    });

    // ── 3. Build DataTable ───────────────────────────────────────────────
    var table = $('#ordersTable').DataTable({
        processing:   true,
        serverSide:   true,
        pageLength:   savedLength,
        displayStart: (savedPage - 1) * savedLength,
        search:       { search: savedSearch },
        order:        [[7, 'desc']],

        ajax: {
            url: "{{ route('admin.orders.data') }}",
            data: function (d) {
                d.status_filter = savedFilter;   // send current tab filter to server
            }
        },

        columns: [
            { data: 'order_number',   name: 'order_number' },
            { data: 'platform',       name: 'platform',       orderable: false, searchable: false },
            { data: 'customer_name',  name: 'user.name' },
            { data: 'customer_phone', name: 'user.mobile_no' },
            { data: 'total_amount',   name: 'total_amount' },
            { data: 'payment_status', name: 'payment_status' },
            { data: 'status',         name: 'status' },
            { data: 'created_at',     name: 'created_at' },
            { data: 'action',         name: 'action', orderable: false, searchable: false }
        ],

        language: {
            processing: '<div class="spinner-border spinner-border-sm text-primary" role="status"></div> Loading...'
        },

        drawCallback: function (settings) {
            // Save current page & search after every draw
            var info = this.api().page.info();
            sessionStorage.setItem('orders_page',   info.page + 1);
            sessionStorage.setItem('orders_search', this.api().search());
            sessionStorage.setItem('orders_length', info.length);
        }
    });

    // ── 4. Tab click → filter & save ────────────────────────────────────
    $('#orderFilterTabs .nav-link').on('click', function (e) {
        e.preventDefault();
        $('#orderFilterTabs .nav-link').removeClass('active');
        $(this).addClass('active');

        savedFilter = $(this).data('filter');
        sessionStorage.setItem('orders_status_filter', savedFilter);

        // Reset to page 1 when filter changes
        sessionStorage.setItem('orders_page', 1);
        savedPage = 1;

        table.ajax.reload();
    });

    // ── 5. Poll for new orders every 15 s (non-disruptive) ──────────────
    var pollingTimer = setInterval(function () {
        // Reload without resetting pagination
        table.ajax.reload(null, false);
    }, 15000);

    // Stop polling when user leaves page
    $(window).on('beforeunload', function () {
        clearInterval(pollingTimer);
    });

    // ── 6. New-order notification bell ──────────────────────────────────
    var lastOrderId = null;

    $.get("{{ route('admin.orders.latest_id') }}", function (res) {
        lastOrderId = res.latest_id;
    });

    var bell = document.getElementById('orderNotificationSound');
    $('body').one('click', function () {
        if (bell) {
            bell.volume = 0;
            bell.play().then(function () {
                bell.pause();
                bell.currentTime = 0;
                bell.volume = 1;
            }).catch(function () {});
        }
    });

    setInterval(function () {
        if (lastOrderId === null) return;
        $.get("{{ route('admin.orders.latest_id') }}", function (res) {
            if (res.latest_id > lastOrderId) {
                lastOrderId = res.latest_id;
                if (bell) bell.play().catch(function () {});
                table.ajax.reload(null, false);
                toastNotify('New order #' + res.order_number + ' arrived!', 'success');
            }
        });
    }, 15000);

    // ── 7. Simple toast helper ───────────────────────────────────────────
    function toastNotify(msg, type) {
        var bg = type === 'success' ? '#198754' : '#dc3545';
        var div = $('<div>')
            .text(msg)
            .css({
                position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999,
                background: bg, color: '#fff', padding: '10px 18px',
                borderRadius: '6px', fontSize: '13px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            })
            .appendTo('body');
        setTimeout(function () { div.fadeOut(400, function () { div.remove(); }); }, 4000);
    }

});
</script>
@endpush