@extends('webadmin.layout.app')

@section('content')
<div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
    <h1 class="h2">Edit Banner</h1>
    <a href="{{ route('admin.banners.index') }}" class="btn btn-sm btn-outline-secondary">
        <i class="bi bi-arrow-left"></i> Back to List
    </a>
</div>

<div class="card shadow-sm border-0 mb-4">
    <div class="card-body">

        @if ($errors->any())
            <div class="alert alert-danger">
                <ul class="mb-0">
                    @foreach ($errors->all() as $error)
                        <li>{{ $error }}</li>
                    @endforeach
                </ul>
            </div>
        @endif

        <form action="{{ route('admin.banners.update', $banner->id) }}" method="POST" enctype="multipart/form-data">
            @csrf
            @method('PUT')

            <div class="row mb-3">
                <div class="col-md-6">
                    <label for="title" class="form-label">Title</label>
                    <input type="text" class="form-control" id="title" name="title" value="{{ old('title', $banner->title) }}">
                </div>
                <div class="col-md-6">
                    <label for="subtitle" class="form-label">Subtitle</label>
                    <input type="text" class="form-control" id="subtitle" name="subtitle" value="{{ old('subtitle', $banner->subtitle) }}">
                </div>
            </div>

            <div class="row mb-3">
                <div class="col-md-6">
                    <label for="target_screen" class="form-label">Target Screen</label>
                    <input type="text" class="form-control" id="target_screen" name="target_screen" value="{{ old('target_screen', $banner->target_screen) }}">
                </div>
            </div>

            <div class="row mb-3">
                <div class="col-md-6">
                    <label for="image" class="form-label">Upload New Image</label>
                    <input class="form-control" type="file" id="image" name="image">
                    <div class="form-text">Upload a new image to replace the current one.</div>
                </div>
                <div class="col-md-6">
                    <label for="image_url" class="form-label">Or Image URL</label>
                    <input type="url" class="form-control" id="image_url" name="image_url" value="{{ old('image_url', str_starts_with($banner->image_url ?? '', 'http') ? $banner->image_url : '') }}">
                    <div class="form-text">Alternatively, provide a direct URL to an existing image.</div>
                </div>
            </div>

            @if($banner->image_url)
            <div class="mb-3">
                <label class="form-label">Current Image</label><br>
                <img src="{{ $banner->image_url }}" alt="Banner" style="max-height: 120px; border-radius: 8px; border: 1px solid #ddd;">
            </div>
            @endif

            <div class="mb-4 form-check form-switch">
                <input class="form-check-input" type="checkbox" role="switch" id="is_active" name="is_active" {{ $banner->is_active ? 'checked' : '' }}>
                <label class="form-check-label" for="is_active">Banner is Active</label>
            </div>

            <div class="d-flex justify-content-end gap-2">
                <a href="{{ route('admin.banners.index') }}" class="btn btn-secondary">Cancel</a>
                <button type="submit" class="btn btn-primary">Update Banner</button>
            </div>
        </form>
    </div>
</div>
@endsection
