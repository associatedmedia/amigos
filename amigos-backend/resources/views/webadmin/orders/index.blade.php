@extends('webadmin.layout.app')

@section('content')
<div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
    <h1 class="h2">Orders</h1>
    <a href="{{ route('admin.orders.create') }}" class="btn btn-sm btn-primary">
        <i class="bi bi-plus-circle"></i> Add Order
    </a>
</div>

<div class="table-responsive bg-white p-3 rounded shadow-sm border">
    <table class="table table-hover align-middle w-100" id="ordersTable">
        <thead class="table-light">
            <tr>
                <th>Order #</th>
                <th>Source</th>
                <th>Customer Name</th>
                <th>Phone</th>
                <th>Total</th>
                <th>Payment Status</th>
                <th>Order Status</th>
                <th>Comments</th>
                <th>Date</th>
                <th>Action</th>
            </tr>
        </thead>
    </table>
</div>
@endsection

@push('scripts')
<script>
    $(document).ready(function() {
        $('#ordersTable').DataTable({
            processing: true,
            serverSide: true,
            stateSave: true,
            order: [[8, "desc"]],
            ajax: "{{ route('admin.orders.data') }}",
            columns: [
                { data: 'order_number', name: 'order_number' },
                { data: 'platform', name: 'platform', orderable: false, searchable: false },
                { data: 'customer_name', name: 'user.name' },
                { data: 'customer_phone', name: 'user.mobile_no' },
                { data: 'total_amount', name: 'total_amount' },
                { data: 'payment_status', name: 'payment_status' },
                { data: 'status', name: 'status' },
                { data: 'comment', name: 'comment' },
                { data: 'created_at', name: 'created_at' },
                { data: 'action', name: 'action', orderable: false, searchable: false }
            ]
        });
    });
</script>
@endpush
