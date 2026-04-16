@extends('webadmin.layout.app')

@section('content')
<div class="d-flex justify-content-between align-items-center mb-4">
    <h2>Push Notifications</h2>
    <a href="{{ route('admin.push_notifications.create') }}" class="btn btn-primary"><i class="bi bi-plus-circle"></i> Create Notification</a>
</div>

<div class="card shadow-sm">
    <div class="card-body">
        <div class="table-responsive">
            <table class="table table-bordered table-striped" id="notificationsTable">
                <thead class="table-dark">
                    <tr>
                        <th>Title</th>
                        <th>Body</th>
                        <th>Status</th>
                        <th>Sent At</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($notifications as $notification)
                    <tr>
                        <td>{{ $notification->title }}</td>
                        <td>{{ \Illuminate\Support\Str::limit($notification->body, 50) }}</td>
                        <td>
                            @if($notification->status === 'sent')
                                <span class="badge bg-success">Sent</span>
                            @else
                                <span class="badge bg-secondary">Draft</span>
                            @endif
                        </td>
                        <td>{{ $notification->sent_at ? $notification->sent_at->format('M d, Y h:i A') : 'N/A' }}</td>
                        <td>
                            @if($notification->status === 'draft')
                            <form action="{{ route('admin.push_notifications.dispatch', $notification->id) }}" method="POST" class="d-inline">
                                @csrf
                                <button type="submit" class="btn btn-sm btn-success" onclick="return confirm('Dispatch this notification to all mobile users now?');">
                                    <i class="bi bi-send"></i> Send
                                </button>
                            </form>
                            <a href="{{ route('admin.push_notifications.edit', $notification->id) }}" class="btn btn-sm btn-warning">
                                <i class="bi bi-pencil"></i> Edit
                            </a>
                            @endif
                            <form action="{{ route('admin.push_notifications.destroy', $notification->id) }}" method="POST" class="d-inline">
                                @csrf
                                @method('DELETE')
                                <button type="submit" class="btn btn-sm btn-danger" onclick="return confirm('Delete this notification?');">
                                    <i class="bi bi-trash"></i> Delete
                                </button>
                            </form>
                        </td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </div>
</div>
@endsection

@push('scripts')
<script>
    $(document).ready(function() {
        $('#notificationsTable').DataTable({
            "order": [[3, "desc"]]
        });
    });
</script>
@endpush
