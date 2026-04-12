@extends('webadmin.layout.app')

@section('content')
<div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
    <h1 class="h2">Coupons</h1>
    <a href="{{ route('admin.coupons.create') }}" class="btn btn-sm btn-primary">
        <i class="bi bi-plus-circle"></i> Add Coupon
    </a>
</div>

<div class="table-responsive bg-white p-3 rounded shadow-sm border">
    <table class="table table-hover align-middle w-100" id="couponsTable">
        <thead class="table-light">
            <tr>
                <th>Code</th>
                <th>Type</th>
                <th>Value</th>
                <th>Min Cart Amount</th>
                <th>Usage Limit</th>
                <th>Usage Limit/User</th>
                <th>Status</th>
                <th>Action</th>
            </tr>
        </thead>
    </table>
</div>
@endsection

@push('scripts')
<script>
    $(document).ready(function() {
        $('#couponsTable').DataTable({
            processing: true,
            serverSide: true,
            ajax: "{{ route('admin.coupons.data') }}",
            columns: [
                { data: 'code', name: 'code' },
                { data: 'type', name: 'type' },
                { data: 'value', name: 'value' },
                { data: 'min_cart_amount', name: 'min_cart_amount' },
                { data: 'usage_limit', name: 'usage_limit', render: function(data){ return data ? data : '&infin;'; } },
                { data: 'usage_limit_per_user', name: 'usage_limit_per_user', render: function(data){ return data ? data : '&infin;'; } },
                { data: 'is_active', name: 'is_active' },
                { data: 'action', name: 'action', orderable: false, searchable: false }
            ]
        });
    });
</script>
@endpush
