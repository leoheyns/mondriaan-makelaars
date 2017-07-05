<?php 
$mysql = mysql_connect("185.56.145.84","retorq1q","cnxdWK4H") or die("Fout: Er is geen verbinding met de MySQL-server tot stand gebracht!");
mysql_select_db("retorq1q_makelaars",$mysql) or die("Fout: Het openen van de database is mislukt!");
$resultaat = mysql_query("SELECT DISTINCT RegioPand FROM panden",$mysql) or die("De query op de database is mislukt!");
mysql_close($mysql) or die("Het verbreken van de verbinding met de MySQL-server is mislukt!");
?>
<form action="Custom.php" method="post">
Regio:
<select name="Regio">
<option value='Alle'>Alle</option>
<?php
while(list($Regio) = mysql_fetch_row($resultaat))
{
print("<option value='$Regio'>$Regio</option>");
}
?> 



</select><br />
<?php 
$mysql = mysql_connect("185.56.145.84","retorq1q","cnxdWK4H") or die("Fout: Er is geen verbinding met de MySQL-server tot stand gebracht!");
mysql_select_db("retorq1q_makelaars",$mysql) or die("Fout: Het openen van de database is mislukt!");
$resultaat = mysql_query("SELECT DISTINCT Type FROM panden",$mysql) or die("De query op de database is mislukt!");
mysql_close($mysql) or die("Het verbreken van de verbinding met de MySQL-server is mislukt!");
?>
<form action="Custom.php" method="post">
Type Huis:
<select name="Type">
<option value='Alle'>Alle</option>
<?php
while(list($Type) = mysql_fetch_row($resultaat))
{
print("<option value='$Type'>$Type</option>");
}
?> 

</select><br />


maximale kosten:
<input type="text" name="KostenMax" maxlength="7" /><br />
minimale kosten:
<input type="text" name="KostenMin" maxlength="7" /><br />
slaapkamers:
<input type="text" name="Slaapkamers" maxlength="7" /><br />

<input type="submit" value="Verzend" />
</form>
<?php
$KostenMax = $_POST["KostenMax"];
$KostenMin = $_POST["KostenMin"];
$Slaapkamers = $_POST["Slaapkamers"];
$Regio = $_POST["Regio"];
$Type = $_POST["Type"];
$TypeQ = "";
$KostenQ = "";
$RegioQ = "";
$SlaapkamersQ = "";
if (is_numeric($KostenMax) && is_numeric($KostenMin))
{
$KostenQ = " AND Verkoopprijs BETWEEN $KostenMin AND $KostenMax";
}
else
{
	$KostenQ = "";
}
if (is_numeric($Slaapkamers))
{
$SlaapkamersQ = " AND Slaapkamers = $Slaapkamers";
}
else
{
	$SlaapkamersQ = "";
}
if ($Regio == "Alle"){
	$RegioQ = "";
}
elseif ($Regio != NULL)
{
$RegioQ = " AND RegioPand = \"$Regio\"";
}
else
{
	$RegioQ = "";
}
if ($Type == "Alle"){
	$TypeQ = "";
}
elseif ($Type != NULL)
{
$TypeQ = " AND Type = \"$Type\"";
}
else
{
	$TypeQ = "";
}
$query = "$KostenQ"."$SlaapkamersQ"."$RegioQ"."$TypeQ";
print ("$query");
$mysql = mysql_connect("185.56.145.84","retorq1q","cnxdWK4H") or die("Fout: Er is geen verbinding met de MySQL-server tot stand gebracht!");
mysql_select_db("retorq1q_makelaars",$mysql) or die("Fout: Het openen van de database is mislukt!");
$resultaat = mysql_query("SELECT * FROM panden Where 1 = 1 $query",$mysql) or die("De query op de database is mislukt!");
mysql_close($mysql) or die("Het verbreken van de verbinding met de MySQL-server is mislukt!");

print("<table><tr><td>PandID</td><td>Pand naam</td><td>VerkoperID</td>
		<td>Verkoop datum</td><td>Inkoopprijs</td><td>Verkoopprijs</td>
		<td>Verkocht?</td><td>RegioPand</td><td>Type</td><td>Plaatje</td>
		<td>Postcode</td><td>Plaats</td><td>Oppervlakte</td><td>Slaapkamers</td>
		<td>Richting tuin</td></tr>");
	 while(list($PandID,$PandNaam,$VerkoperID,$VerkoopDatum,$Inkoopprijs,$Verkoopprijs,$Verkocht,$RegioPand,$Type,$Plaatje,$Postcode,$Plaats,$Oppervlakte,$Slaapkamers,$RichtingTuin) = mysql_fetch_row($resultaat))
	 {
		$Link = "<a href=\"PandDetails.php/?PandID=$PandID\">$PandNaam</a>";
		$Image = "<img src=$Plaatje alt=\"plaatje\" style=\"width:200;height:100;\">";
	  	echo("<tr><td>$PandID</td><td>$Link</td><td>$VerkoperID</td>
		<td>$VerkoopDatum</td><td>$Inkoopprijs</td><td>$Verkoopprijs</td>
		<td>$Verkocht</td><td>$RegioPand</td><td>$Type</td><td>$Image</td>
		<td>$Postcode</td><td>$Plaats</td><td>$Oppervlakte</td><td>$Slaapkamers</td>
		<td>$RichtingTuin</td></tr>");
	 }	
print("</table>");

?>
