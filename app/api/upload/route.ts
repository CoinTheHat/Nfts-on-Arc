import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // Initialize Supabase Client (Server-side)
        // We use the service role key if available for bypassing RLS, or just standard key if RLS allows anon uploads
        // For this demo, we assume the public anon key has access or user is authenticated
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        // Upload to 'uploads' bucket (User needs to create this bucket in Supabase)
        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('uploads')
            .upload(filePath, file);

        if (uploadError) {
            console.error('Supabase storage upload error:', uploadError);
            return NextResponse.json({ error: uploadError.message }, { status: 500 });
        }

        // Get Public URL
        const { data: publicUrlData } = supabase
            .storage
            .from('uploads')
            .getPublicUrl(filePath);

        return NextResponse.json({ url: publicUrlData.publicUrl });
    } catch (error) {
        console.error('Upload handler error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
