<div class="table-responsive bg-white p-3 rounded shadow-sm border">
    <table class="table table-hover align-middle">
        <thead class="table-light">
            <tr>
                <th>Order #</th>
                <th>Source</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
            </tr>
        </thead>
        <tbody>
            @forelse($orders as $order)
                <tr>
                    <td><strong>#{{ $order->order_number ?? $order->id }}</strong></td>
                    <td>
                        @if(strtolower($order->platform) === 'ios')
                            <i class="bi bi-apple fs-5" title="iOS"></i>
                        @elseif(strtolower($order->platform) === 'android')
                            <i class="bi bi-android2 fs-5 text-success" title="Android"></i>
                        @else
                            <i class="bi bi-globe fs-5 text-secondary" title="Web"></i>
                        @endif
                    </td>
                    <td>
                        {{ $order->user ? $order->user->name : 'Guest' }}<br>
                        <small class="text-muted">{{ $order->user ? $order->user->mobile_no : 'N/A' }}</small>
                    </td>
                    <td>₹{{ number_format($order->total_amount, 2) }}</td>
                    <td>
                        @php
                            $statusColors = [
                                'pending' => 'warning',
                                'accepted' => 'info',
                                'assigned' => 'info',
                                'picked_up' => 'primary',
                                'processing' => 'primary',
                                'delivered' => 'success',
                                'completed' => 'success',
                                'cancelled' => 'danger',
                                'refunded' => 'danger',
                            ];
                            $color = $statusColors[$order->status] ?? 'secondary';
                        @endphp
                        <span class="badge bg-{{ $color }}">{{ ucfirst(str_replace('_', ' ', $order->status)) }}</span>
                    </td>
                    <td>{{ $order->created_at->format('M d, Y h:i A') }}</td>
                    <td>
                        <a href="{{ route('admin.orders.show', $order->id) }}" class="btn btn-sm btn-outline-primary">View</a>
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="7" class="text-center text-muted py-4">No orders found.</td>
                </tr>
            @endforelse
        </tbody>
    </table>
</div>
