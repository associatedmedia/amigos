@extends('webadmin.layout.app')

@section('content')
<div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
    <h1 class="h2">Customer Details</h1>
    <a href="{{ route('admin.customers.index') }}" class="btn btn-secondary btn-sm"><i class="bi bi-arrow-left"></i> Back to Customers</a>
</div>

<div class="row">
    <div class="col-md-6 mb-4">
        <div class="card shadow-sm border-0">
            <div class="card-body">
                <h5 class="card-title fw-bold mb-4"><i class="bi bi-person-circle text-primary"></i> {{ $customer->name }}</h5>
                
                <table class="table table-borderless">
                    <tbody>
                        <tr>
                            <td class="text-muted" style="width: 120px;">Phone:</td>
                            <td class="fw-bold">{{ $customer->mobile_no }}</td>
                        </tr>
                        <tr>
                            <td class="text-muted">Email:</td>
                            <td>{{ $customer->email ?? 'Not Provided' }}</td>
                        </tr>
                        <tr>
                            <td class="text-muted">Address:</td>
                            <td>{{ $customer->address ?? 'Not Provided' }}</td>
                        </tr>
                        <tr>
                            <td class="text-muted">Joined:</td>
                            <td>{{ $customer->created_at->format('M d, Y h:i A') }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="card-footer bg-white border-top-0 pb-3">
                 <a href="{{ route('admin.customers.edit', $customer->id) }}" class="btn btn-primary w-100"><i class="bi bi-pencil"></i> Edit Customer</a>
            </div>
        </div>
    </div>
</div>
@endsection
