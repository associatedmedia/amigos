@extends('webadmin.layout.app')

@section('content')
<div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
    <h1 class="h2">Create Order (Not Implemented)</h1>
    <a href="{{ route('admin.orders.index') }}" class="btn btn-secondary btn-sm"><i class="bi bi-arrow-left"></i> Back to Orders</a>
</div>

<div class="card shadow-sm border-0">
    <div class="card-body text-center py-5">
        <i class="bi bi-tools display-1 text-muted mb-3"></i>
        <h3>Manual Order Creation Unavailable</h3>
        <p class="text-muted">Currently, orders are designed to be created exclusively via the mobile application or consumer web interfaces. A manual backend order entry system is not yet fully configured.</p>
        <a href="{{ route('admin.orders.index') }}" class="btn btn-primary mt-3">Return to Dashboard</a>
    </div>
</div>
@endsection
