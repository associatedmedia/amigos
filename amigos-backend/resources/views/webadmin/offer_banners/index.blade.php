@extends('webadmin.layout.app')

@push('scripts')
<meta name="csrf-token" content="{{ csrf_token() }}">
@endpush

@section('content')
<div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
    <h1 class="h2">Offer Banners</h1>
    <a href="{{ route('admin.offer-banners.create') }}" class="btn btn-sm btn-primary">
        <i class="bi bi-plus-circle"></i> Add Offer Banner
    </a>
</div>

<div class="table-responsive bg-white p-3 rounded shadow-sm border">
    <table class="table table-hover align-middle w-100" id="offerBannersTable">
        <thead class="table-light">
            <tr>
                <th>ID</th>
                <th>Image</th>
                <th>Title</th>
                <th>Status</th>
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
        table = $('#offerBannersTable').DataTable({
            processing: true,
            serverSide: true,
            order: [[0, "desc"]],
            ajax: "{{ route('admin.offer-banners.data') }}",
            columns: [
                { data: 'id', name: 'id' },
                { data: 'image_url', name: 'image_url', orderable: false, searchable: false },
                { data: 'title', name: 'title' },
                { data: 'is_active', name: 'is_active', searchable: false },
                { data: 'action', name: 'action', orderable: false, searchable: false }
            ]
        });
    });

    function confirmDelete(url) {
        if (confirm('Are you certain you wish to delete this offer banner?')) {
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
                        alert(result.message || 'Error deleting banner.');
                    }
                },
                error: function(err) {
                    alert('Server Error deleting banner.');
                }
            });
        }
    }
</script>
@endpush
