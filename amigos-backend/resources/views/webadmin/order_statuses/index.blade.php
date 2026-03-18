@extends('webadmin.layout.app')

@section('content')
<div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
    <h1 class="h2">Order Statuses</h1>
    <a href="{{ route('admin.order-statuses.create') }}" class="btn btn-sm btn-primary">
        <i class="bi bi-plus-circle"></i> Add Status
    </a>
</div>

<div class="table-responsive bg-white p-3 rounded shadow-sm border">
    <table class="table table-hover align-middle w-100" id="orderStatusesTable">
        <thead class="table-light">
            <tr>
                <th>ID</th>
                <th>Status Code</th>
                <th>Display Label</th>
                <th>Step Index</th>
                <th>Action</th>
            </tr>
        </thead>
    </table>
</div>
@endsection

@push('scripts')
<script>
    $(document).ready(function() {
        $('#orderStatusesTable').DataTable({
            processing: true,
            serverSide: true,
            order: [[3, "asc"], [0, "asc"]], // Sort by step_index and id
            ajax: "{{ route('admin.order-statuses.data') }}",
            columns: [
                { data: 'id', name: 'id' },
                { data: 'status_code', name: 'status_code' },
                { data: 'label', name: 'label' },
                { data: 'step_index', name: 'step_index' },
                { data: 'action', name: 'action', orderable: false, searchable: false }
            ]
        });
    });

    function confirmDelete(url) {
        if(confirm('Are you sure you want to delete this order status? This might affect existing orders!')) {
            $.ajax({
                url: url,
                type: 'POST',
                data: {
                    _method: 'DELETE',
                    _token: '{{ csrf_token() }}'
                },
                success: function(response) {
                    if(response.success) {
                        $('#orderStatusesTable').DataTable().ajax.reload();
                    }
                }
            });
        }
    }
</script>
@endpush
