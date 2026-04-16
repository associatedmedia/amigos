@extends('webadmin.layout.app')

@section('content')
<div class="d-flex justify-content-between align-items-center mb-4">
    <h2>Create Push Notification</h2>
    <a href="{{ route('admin.push_notifications.index') }}" class="btn btn-secondary"><i class="bi bi-arrow-left"></i> Back to List</a>
</div>

<div class="card shadow-sm">
    <div class="card-body">
        <form action="{{ route('admin.push_notifications.store') }}" method="POST">
            @csrf
            <div class="mb-3">
                <label for="title" class="form-label">Notification Title <span class="text-danger">*</span></label>
                <input type="text" class="form-control" id="title" name="title" value="{{ old('title') }}" required placeholder="e.g., Weekend Flash Sale!">
            </div>
            
            <div class="mb-3">
                <label for="body" class="form-label">Notification Body/Message <span class="text-danger">*</span></label>
                <textarea class="form-control" id="body" name="body" rows="4" required placeholder="e.g., Get 50% off all pizzas this weekend. Tap to order now!">{{ old('body') }}</textarea>
            </div>
            
            <div class="mb-3 d-none">
                <label for="target_audience" class="form-label">Target Audience</label>
                <select class="form-select" id="target_audience" name="target_audience">
                    <option value="all">All Users</option>
                </select>
                <small class="text-muted">By default, this will be dispatched to all users with installed applications.</small>
            </div>

            <button type="submit" class="btn btn-primary"><i class="bi bi-save"></i> Save Draft</button>
        </form>
    </div>
</div>
@endsection
