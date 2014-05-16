Shader "Custom/HeightDependentTint" 
{
  Properties 
  {
    _MainTex ("Base (RGB)", 2D) = "white" {}
    _HeightMin ("Height Min", Float) = -1
    _HeightMax ("Height Max", Float) = 1
    _MidRange ("Size of Middle", Float) = 0.2
    _ColorMin ("Tint Color At Min", Color) = (0,0,0,1)
    _ColorMid ("Tint Color At Middle", Color) = (1,0,0,1)
    _ColorMax ("Tint Color At Max", Color) = (1,1,1,1)
  }
 
  SubShader
  {
    Tags { "RenderType"="Opaque" }
 
    CGPROGRAM
    #pragma surface surf Lambert
 
    sampler2D _MainTex;
    fixed4 _ColorMin;
    fixed4 _ColorMid;
    fixed4 _ColorMax;
    float _HeightMin;
    float _HeightMax;
    float _MidRange;
 
    struct Input
    {
      float2 uv_MainTex;
      float3 worldPos;
    };
 
    void surf (Input IN, inout SurfaceOutput o) 
    {
      half4 c = tex2D (_MainTex, IN.uv_MainTex);
      float h = (_HeightMax-IN.worldPos.y) / (_HeightMax-_HeightMin);
      fixed4 tintColor = (0,0,0,0);

      //Smooth transition
      if (h < 0.5) {
      	tintColor = lerp(_ColorMin.rgba, _ColorMid.rgba, h*2);
      } else {
      	tintColor = lerp(_ColorMid.rgba, _ColorMax.rgba, h*2-1);
      }

      //float HeightRange = _HeightMax-_HeightMin;
      //float MidRatio = _MidRange/HeightRange;
      //if (h <= 0.5 - MidRatio/2 ) {
      //	tintColor = lerp(_ColorMin.rgba, _ColorMid.rgba, h / (0.5-MidRatio/2) );
      //} else if ( h < 0.5 + MidRatio/2) {
      //	tintColor = _ColorMid;
      //} else {
      //	tintColor = lerp(_ColorMid.rgba, _ColorMax.rgba, (h-0.5-MidRatio/2) / (0.5-MidRatio/2));
      //}

      o.Albedo = c.rgb * tintColor.rgb;
      o.Alpha = c.a * tintColor.a;
    }
    ENDCG
  } 
  Fallback "Diffuse"
}