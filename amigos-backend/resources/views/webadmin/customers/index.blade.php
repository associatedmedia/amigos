@extends('webadmin.layout.app')

@section('content')
<div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
    <h1 class="h2">Customers</h1>
    <a href="{{ route('admin.customers.create') }}" class="btn btn-sm btn-primary">
        <i class="bi bi-plus-circle"></i> Add Customer
    </a>
</div>

<div class="table-responsive bg-white p-3 rounded shadow-sm border">
    <table class="table table-hover align-middle w-100" id="customersTable">
        <thead class="table-light">
            <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Joined</th>
                <th>Action</th>
            </tr>
        </thead>
    </table>
</div>

@endsection

@push('scripts')
<script>
    $(document).ready(function() {
        $('#customersTable').DataTable({
            processing: true,
            serverSide: true,
            stateSave: true,
            order: [[3, "desc"]], // Sort by Joined Date (created_at) by default
            ajax: "{{ route('admin.customers.data') }}",
            columns: [
                { data: 'name', name: 'name' },
                { data: 'mobile_no', name: 'mobile_no' },
                { data: 'address', name: 'address', orderable: false, searchable: false },
                { data: 'created_at', name: 'created_at', render: function(data){ 
                    return new Date(data).toLocaleDateString(); 
                }},
                { data: 'action', name: 'action', orderable: false, searchable: false }
            ]
        });
    });

    function toggleStatus(url) {
        $.ajax({
            url: url,
            type: 'POST',
            data: {
                _token: '{{ csrf_token() }}'
            },
            success: function(response) {
                if(response.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Success!',
                        text: response.message,
                        timer: 1500,
                        showConfirmButton: false
                    });
                    $('#customersTable').DataTable().ajax.reload(null, false);
                } else {
                    Swal.fire('Error!', 'Something went wrong.', 'error');
                }
            },
            error: function() {
                Swal.fire('Error!', 'Failed to update customer status.', 'error');
            }
        });
    }
</script>
@endpush
