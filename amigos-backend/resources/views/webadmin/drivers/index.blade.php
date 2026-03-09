@extends('webadmin.layout.app')

@push('scripts')
<meta name="csrf-token" content="{{ csrf_token() }}">
@endpush

@section('content')
<div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
    <h1 class="h2">Delivery Boys</h1>
    <a href="{{ route('admin.drivers.create') }}" class="btn btn-sm btn-primary">
        <i class="bi bi-plus-circle"></i> Add Delivery Boy
    </a>
</div>

<div class="table-responsive bg-white p-3 rounded shadow-sm border">
    <table class="table table-hover align-middle w-100" id="driversTable">
        <thead class="table-light">
            <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Mobile Number</th>
                <th>Joined</th>
                <th>Action</th>
            </tr>
        </thead>
    </table>
</div>
@endsection

@push('scripts')
<script>
    let table;
    $(document).ready(function() {
        table = $('#driversTable').DataTable({
            processing: true,
            serverSide: true,
            order: [[0, "desc"]],
            ajax: "{{ route('admin.drivers.data') }}",
            columns: [
                { data: 'id', name: 'id' },
                { data: 'name', name: 'name' },
                { data: 'mobile_no', name: 'mobile_no' },
                { 
                    data: 'created_at', 
                    name: 'created_at',
                    render: function(data) {
                        if(!data) return 'N/A';
                        let date = new Date(data);
                        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                    }
                },
                { data: 'action', name: 'action', orderable: false, searchable: false }
            ]
        });
    });

    function confirmDelete(url) {
        if (confirm('Are you certain you wish to remove this delivery boy?')) {
            $.ajax({
                url: url,
                type: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
                },
                success: function(result) {
                    if(result.success) {
                        table.ajax.reload();
                    } else {
                        alert(result.message || 'Error deleting driver.');
                    }
                },
                error: function(err) {
                    alert('Server Error deleting driver.');
                }
            });
        }
    }
</script>
@endpush
