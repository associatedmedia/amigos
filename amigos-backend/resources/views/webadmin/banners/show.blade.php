@extends('webadmin.layout.app')

@section('content')
<div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
    <h1 class="h2">Banner Details</h1>
    <div>
        <a href="{{ route('admin.banners.index') }}" class="btn btn-sm btn-outline-secondary">
            <i class="bi bi-arrow-left"></i> Back to List
        </a>
        <a href="{{ route('admin.banners.edit', $banner->id) }}" class="btn btn-sm btn-primary ms-2">
            <i class="bi bi-pencil"></i> Edit Banner
        </a>
    </div>
</div>

<div class="row">
    <div class="col-md-8">
        <div class="card shadow-sm border-0 mb-4">
            <div class="card-header bg-white fw-bold">Banner Information</div>
            <div class="card-body">
                <table class="table table-borderless">
                    <tr>
                        <th style="width: 150px;">Title</th>
                        <td>{{ $banner->title ?? 'N/A' }}</td>
                    </tr>
                    <tr>
                        <th>Subtitle</th>
                        <td>{{ $banner->subtitle ?? 'N/A' }}</td>
                    </tr>
                    <tr>
                        <th>Target Screen</th>
                        <td>{{ $banner->target_screen ?? 'N/A' }}</td>
                    </tr>
                    <tr>
                        <th>Target Params</th>
                        <td>
                            @if($banner->target_params)
                                <pre class="bg-light p-2 rounded border">{{ json_encode($banner->target_params, JSON_PRETTY_PRINT) }}</pre>
                            @else
                                <span class="text-muted">None</span>
                            @endif
                        </td>
                    </tr>
                    <tr>
                        <th>Status</th>
                        <td>
                            @if($banner->is_active)
                                <span class="badge bg-success">Active</span>
                            @else
                                <span class="badge bg-secondary">Inactive</span>
                            @endif
                        </td>
                    </tr>
                    <tr>
                        <th>Created At</th>
                        <td>{{ $banner->created_at ? $banner->created_at->format('d M Y, h:i A') : 'N/A' }}</td>
                    </tr>
                    <tr>
                        <th>Updated At</th>
                        <td>{{ $banner->updated_at ? $banner->updated_at->format('d M Y, h:i A') : 'N/A' }}</td>
                    </tr>
                </table>
            </div>
        </div>
    </div>
    <div class="col-md-4">
        <div class="card shadow-sm border-0 mb-4">
            <div class="card-header bg-white fw-bold">Banner Image</div>
            <div class="card-body text-center">
                @if($banner->image_url)
                    <img src="{{ $banner->image_url }}" alt="Banner Image" class="img-fluid rounded" style="max-height: 250px; object-fit: cover;">
                @else
                    <div class="p-5 bg-light rounded text-muted">
                        <i class="bi bi-image" style="font-size: 3rem;"></i>
                        <p class="mt-2">No image available</p>
                    </div>
                @endif
            </div>
        </div>
    </div>
</div>
@endsection
