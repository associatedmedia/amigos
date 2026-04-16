@extends('webadmin.layout.app')

@section('content')
<div class="d-flex justify-content-between align-items-center mb-4">
    <h2>Edit Push Notification Draft</h2>
    <a href="{{ route('admin.push_notifications.index') }}" class="btn btn-secondary"><i class="bi bi-arrow-left"></i> Back to List</a>
</div>

<div class="card shadow-sm">
    <div class="card-body">
        <form action="{{ route('admin.push_notifications.update', $pushNotification->id) }}" method="POST">
            @csrf
            @method('PUT')
            <div class="mb-3">
                <label for="title" class="form-label">Notification Title <span class="text-danger">*</span></label>
                <input type="text" class="form-control" id="title" name="title" value="{{ old('title', $pushNotification->title) }}" required>
            </div>
            
            <div class="mb-3">
                <label for="body" class="form-label">Notification Body/Message <span class="text-danger">*</span></label>
                <textarea class="form-control" id="body" name="body" rows="4" required>{{ old('body', $pushNotification->body) }}</textarea>
            </div>

            <button type="submit" class="btn btn-primary"><i class="bi bi-save"></i> Update Draft</button>
        </form>
    </div>
</div>
@endsection
