param(
  [Parameter(Mandatory=$true)][string]$Slug,
  [Parameter(Mandatory=$true)][string]$Title,
  [Parameter(Mandatory=$true)][string]$Description,
  [Parameter(Mandatory=$true)][string]$Category,
  [Parameter(Mandatory=$true)][int]$Minutes,
  [Parameter(Mandatory=$true)][string]$Hero,
  [Parameter(Mandatory=$true)][string]$SectionsJson,
  [Parameter(Mandatory=$true)][string]$PointsJson,
  [Parameter(Mandatory=$true)][string]$FaqsJson,
  [Parameter(Mandatory=$true)][string]$RelatedJson,
  [string]$NextSlug,
  [string]$NextTitle,
  [string]$ImageTitle
)
$ErrorActionPreference='Stop'
$baseUrl='https://empid.com'
$siteRoot=Split-Path -Parent $PSCommandPath
$template=Get-Content (Join-Path $siteRoot 'tmp-post-template.html') -Raw
$blogDir=Join-Path $siteRoot 'blog'
$assetsDir=Join-Path $siteRoot 'assets/blog'
New-Item -ItemType Directory -Path $assetsDir -Force | Out-Null

$sections=ConvertFrom-Json -InputObject $SectionsJson
$points=ConvertFrom-Json -InputObject $PointsJson
$faqs=ConvertFrom-Json -InputObject $FaqsJson
$related=ConvertFrom-Json -InputObject $RelatedJson

function Escape-Xml([string]$v){if([string]::IsNullOrWhiteSpace($v)){''}else{$v.Replace('&','&amp;').Replace('<','&lt;').Replace('>','&gt;').Replace('"','&quot;').Replace("'",'&apos;')}}
function RenderList([array]$arr){if(-not $arr){''}; return (($arr|ForEach-Object{'<li>'+[System.Net.WebUtility]::HtmlEncode($_)+'</li>'}) -join '')}
function RenderFaq([array]$items){$a=@();for($i=0;$i -lt $items.Count;$i++){ $o=if($i -eq 0){' open'}else{''};$a += "<details$o><summary>$([System.Net.WebUtility]::HtmlEncode($items[$i].q))</summary><p>$([System.Net.WebUtility]::HtmlEncode($items[$i].a))</p></details>" }; return "<h2>??????? ???????</h2><div class='faq-list compact-faq'>"+($a -join '')+'</div>'}
function RenderRelated([array]$items){$a=@();foreach($i in $items){$a += "<a href='$([System.Net.WebUtility]::HtmlEncode($i.url))'>$([System.Net.WebUtility]::HtmlEncode($i.text))</a>"}; return "<h2>????? ??????</h2><div class='related-links'>"+($a -join '')+'</div>'}
function BuildLd([string]$url,[string]$title,[string]$desc,[string]$image,[array]$faqItems){
  $faqNodes=@(); foreach($f in $faqItems){$faqNodes += @{ '@type'='Question'; name=$f.q; acceptedAnswer=@{ '@type'='Answer'; text=$f.a } }}
  $ld=@{
    '@context'='https://schema.org'
    '@graph'=@(
      @{ '@type'='BreadcrumbList'; '@id'="$url#breadcrumb"; itemListElement=@(
          @{ '@type'='ListItem'; position=1; name='????????'; item='https://empid.com/' },
          @{ '@type'='ListItem'; position=2; name='???????'; item='https://empid.com/blog/' },
          @{ '@type'='ListItem'; position=3; name=$title; item=$url }
      )},
      @{ '@type'='Article'; '@id'="$url#article"; headline=$title; description=$desc; inLanguage='ar'; datePublished='2026-06-13'; dateModified='2026-06-13'; author=@{ '@type'='Organization'; name='EMPID' }; publisher=@{ '@type'='Organization'; name='EMPID'; logo=@{ '@type'='ImageObject'; url='https://empid.com/assets/EMPID_Arabic_Transparent.png' } }; image=@{ '@type'='ImageObject'; url=$image }; mainEntityOfPage=$url },
      @{ '@type'='FAQPage'; '@id'="$url#faq"; mainEntity=$faqNodes }
    )
  }
  return ($ld | ConvertTo-Json -Depth 12 -Compress)
}

$canonical="$baseUrl/blog/$Slug.html"; $ogImage="$baseUrl/assets/blog/$Slug.svg"
$sectionHtml=@(); for($i=0;$i -lt 4;$i++){ if($i -lt $sections.Count){ $sectionHtml += "<h2>$([System.Net.WebUtility]::HtmlEncode($sections[$i].h))</h2><p>$([System.Net.WebUtility]::HtmlEncode($sections[$i].b))</p>" } else { $sectionHtml += '' } }
$nextHtml=''; if($NextSlug -and $NextTitle){ $n=[System.Net.WebUtility]::HtmlEncode($NextTitle); $nextHtml="<div class='mid-cta'><h2>?????? ??????</h2><p>????: <a href='/blog/$NextSlug.html'>$n</a>.</p></div>" }

$ldJson=BuildLd -url $canonical -title $Title -desc $Description -image $ogImage -faqItems $faqs

$html=$template
$html=$html.Replace('{{TITLE}}',[System.Net.WebUtility]::HtmlEncode($Title))
$html=$html.Replace('{{DESCRIPTION}}',[System.Net.WebUtility]::HtmlEncode($Description))
$html=$html.Replace('{{CANONICAL}}',$canonical)
$html=$html.Replace('{{OG_IMAGE}}',$ogImage)
$html=$html.Replace('{{LD_JSON}}',$ldJson)
$html=$html.Replace('{{CATEGORY}}',[System.Net.WebUtility]::HtmlEncode($Category))
$html=$html.Replace('{{MINUTES}}',$Minutes.ToString())
$html=$html.Replace('{{HERO}}',[System.Net.WebUtility]::HtmlEncode($Hero))
$pointHtml = RenderList -arr $points
$faqHtml = RenderFaq -items $faqs
$relHtml = RenderRelated -items $related
$html=$html.Replace('{{POINTS}}',$pointHtml)
$html=$html.Replace('{{SECTION1}}',$sectionHtml[0])
$html=$html.Replace('{{SECTION2}}',$sectionHtml[1])
$html=$html.Replace('{{SECTION3}}',$sectionHtml[2])
$html=$html.Replace('{{SECTION4}}',$sectionHtml[3])
$html=$html.Replace('{{NEXT_LINK}}',$nextHtml)
$html=$html.Replace('{{FAQS}}',$faqHtml)
$html=$html.Replace('{{RELATED}}',$relHtml)

Set-Content -Path (Join-Path $blogDir "$Slug.html") -Value $html -Encoding utf8
$aliasDir=Join-Path $blogDir $Slug; New-Item -ItemType Directory -Path $aliasDir -Force | Out-Null
$redirect="<!DOCTYPE html>`n<html lang='ar' dir='rtl'>`n<head>`n  <meta charset='UTF-8'>`n  <meta http-equiv='refresh' content='0; url=/blog/$Slug.html'>`n  <link rel='canonical' href='$canonical'>`n  <meta name='robots' content='index, follow'>`n  <title>????? ????? | EMPID</title>`n  <script>window.location.replace('/blog/$Slug.html');</script>`n</head>`n<body>`n  <p>????? ????? ??? <a href='/blog/$Slug.html'>?????? ???????</a>.</p>`n</body>`n</html>`n"
Set-Content -Path (Join-Path $aliasDir 'index.html') -Value $redirect -Encoding utf8

$palette=@('2563EB','0EA5E9','059669','DB2777','D97706','0E7490','4C1D95','0F766E','0284C7','4A5568'); $color=$palette[[Math]::Abs($Slug.GetHashCode()) % $palette.Count]
if ([string]::IsNullOrWhiteSpace($ImageTitle)) { $imgText = $Title } else { $imgText = $ImageTitle }
$imgText = Escape-Xml($imgText)
if($imgText.Length -gt 62){$imgText=$imgText.Substring(0,62)+'...'}
$svg="<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='630' viewBox='0 0 1200 630'>`n  <defs><linearGradient id='g' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='#0f172a'/><stop offset='100%' stop-color='#$color'/></linearGradient></defs>`n  <rect width='1200' height='630' fill='url(#g)'/>`n  <text x='80' y='210' fill='#e2e8f0' font-family='Arial' font-size='56' font-weight='700'>EMPID Blog</text>`n  <text x='80' y='285' fill='#cbd5e1' font-family='Arial' font-size='32'>?????? ????? ??????? ???????</text>`n  <foreignObject x='80' y='330' width='1040' height='220'>`n    <div xmlns='http://www.w3.org/1999/xhtml' style='font-family: Arial; color: #f8fafc; font-size: 52px; line-height: 1.1; font-weight: 700;'>$imgText</div>`n  </foreignObject>`n  <text x='80' y='600' fill='#94a3b8' font-family='Arial' font-size='28'>empid.com/blog/</text>`n</svg>`n"
Set-Content -Path (Join-Path $assetsDir "$Slug.svg") -Value $svg -Encoding utf8
