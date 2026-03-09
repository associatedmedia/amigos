@extends('webadmin.layout.app')

@section('content')
<div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
    <h1 class="h2">Products</h1>
    <a href="{{ route('admin.products.create') }}" class="btn btn-sm btn-primary">
        <i class="bi bi-plus-circle"></i> Add Product
    </a>
</div>

<div class="table-responsive bg-white p-3 rounded shadow-sm border">
    <table class="table table-hover align-middle w-100" id="productsTable">
        <thead class="table-light">
            <tr>
                <th>ID</th>
                <th>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Type</th>
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
        $('#productsTable').DataTable({
            processing: true,
            serverSide: true,
            order: [[0, "desc"]],
            ajax: "{{ route('admin.products.data') }}",
            columns: [
                { data: 'id', name: 'id' },
                { data: 'image_url', name: 'image_url', orderable: false, searchable: false },
                { data: 'name', name: 'name' },
                { data: 'category', name: 'category' },
                { data: 'price', name: 'price' },
                { data: 'type', name: 'type' },
                { data: 'is_available', name: 'is_available' },
                { data: 'action', name: 'action', orderable: false, searchable: false }
            ]
        });
    });

    function confirmDelete(url) {
        Swal.fire({
            title: 'Are you sure?',
            text: "This product will be permanently deleted!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: url,
                    type: 'DELETE',
                    data: {
                        _token: '{{ csrf_token() }}'
                    },
                    success: function(response) {
                        if(response.success) {
                            Swal.fire('Deleted!', 'The product has been deleted.', 'success');
                            $('#productsTable').DataTable().ajax.reload();
                        } else {
                            Swal.fire('Error!', 'Something went wrong.', 'error');
                        }
                    },
                    error: function() {
                        Swal.fire('Error!', 'Failed to delete the product.', 'error');
                    }
                });
            }
        });
    }
</script>
@endpush
